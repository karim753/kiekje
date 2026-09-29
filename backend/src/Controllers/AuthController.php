<?php

namespace Kiekje\Controllers;

use Kiekje\Core\HttpException;
use Kiekje\Core\Validator;
use Kiekje\Repositories\UserRepository;
use PDOException;

/**
 * Account: registreren, inloggen, uitloggen, profiel en profielfoto (api/auth.php).
 *
 * Hash & Salt: wachtwoorden worden nooit als platte tekst opgeslagen. password_hash() gebruikt bcrypt
 * en maakt per wachtwoord een unieke salt, die in de hash zelf verwerkt zit; password_verify() controleert.
 */
class AuthController extends Controller
{
    protected string $databaseErrorMessage = 'Serverfout.';
    private UserRepository $users;

    protected function handle(): void
    {
        // alleen POST: anders kan een andere site je via een gewone link uitloggen (CSRF)
        if (!$this->request->isPost()) {
            throw new HttpException('Methode niet toegestaan.', 405);
        }
        $this->users = new UserRepository($this->db());
        $this->dispatch([
            'register' => 'register',
            'login' => 'login',
            'me' => 'me',
            'update_profile' => 'updateProfile',
            'update_avatar' => 'updateAvatar',
            'logout' => 'logout',
        ], $this->request->action(), 404);
    }

    protected function register(): void
    {
        $username = $this->request->text('username');
        $email = $this->request->text('email');
        $password = (string) $this->request->input('password', '');

        if ($username === '' || $email === '' || strlen($password) < 8) {
            throw new HttpException('Ongeldige invoer. Wachtwoord moet minimaal 8 tekens zijn.', 422);
        }
        Validator::username($username);
        Validator::email($email);

        $hash = password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]); // hash + salt
        try {
            $id = $this->users->create($username, $email, $hash);
        } catch (PDOException $e) {
            if ($e->getCode() === '23000') { // unieke sleutel: naam of e-mail bestaat al
                throw new HttpException('Gebruikersnaam of e-mail bestaat al.', 409);
            }
            throw $e;
        }
        $this->session->login($id); // direct ingelogd
        $this->ok(['user_id' => $id, 'username' => $username]);
    }

    protected function login(): void
    {
        $identifier = $this->request->text('identifier');
        $password = (string) $this->request->input('password', '');
        if ($identifier === '' || $password === '') {
            throw new HttpException('Vul gebruikersnaam/e-mail en wachtwoord in.', 422);
        }

        $user = $this->users->findForLogin($identifier);
        if (!$user || !password_verify($password, $user['password_hash'])) {
            throw new HttpException('Onjuiste inloggegevens.', 401);
        }
        $this->session->login((int) $user['id']);
        $this->ok(['username' => $user['username']]);
    }

    protected function me(): void
    {
        $id = $this->session->userId();
        if (!$id) {
            throw new HttpException('Niet ingelogd', 401);
        }
        $user = $this->users->findById($id);
        if (!$user) {
            throw new HttpException('Sessiegebruiker bestaat niet', 401);
        }
        $this->ok(['username' => $user['username'], 'user_id' => (int) $user['id'], 'bio' => $user['bio'] ?? '', 'avatar' => $user['avatar_url']]);
    }

    protected function updateProfile(): void
    {
        $me = $this->currentUser();
        $username = $this->request->text('username');
        $bio = $this->request->text('bio');
        // alleen een nieuwe naam controleren: oudere accounts met bv. een @ in de naam kunnen hun bio blijven wijzigen
        if ($username !== $me['username']) {
            Validator::username($username);
        }
        Validator::maxLength($bio, 160, 'Bio mag maximaal 160 tekens zijn.');

        try {
            $this->users->updateProfile($me['id'], $username, $bio);
        } catch (PDOException $e) {
            if ($e->getCode() === '23000') {
                throw new HttpException('Deze gebruikersnaam is al in gebruik.', 409);
            }
            throw $e;
        }
        $this->ok(['username' => $username, 'bio' => $bio]);
    }

    /** Profielfoto wijzigen ({image: data-URL}) of verwijderen ({remove: true}). */
    protected function updateAvatar(): void
    {
        $me = $this->currentUser();
        $oldPath = $this->users->findById($me['id'])['avatar_url'] ?? null;

        $path = null;
        if (!$this->request->input('remove')) {
            Validator::required($this->request->input('image'), 'Kies een afbeelding.');
            $path = $this->images()->save((string) $this->request->input('image'));
        }
        $this->users->updateAvatar($me['id'], $path);
        $this->images()->delete($oldPath);
        $this->ok(['avatar' => $path]);
    }

    protected function logout(): void
    {
        $this->session->logout();
        $this->ok();
    }
}
