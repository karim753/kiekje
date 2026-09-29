<?php

namespace Kiekje\Controllers;

use Kiekje\Core\Database;
use Kiekje\Core\HttpException;
use Kiekje\Core\ImageStorage;
use Kiekje\Core\Request;
use Kiekje\Core\Response;
use Kiekje\Core\Session;
use Kiekje\Repositories\UserRepository;
use PDO;
use PDOException;
use Throwable;

/**
 * Basisklasse voor alle controllers (één controller per API-endpoint).
 *
 * - run() voert handle() uit en zet elke fout om in een net JSON-antwoord;
 * - currentUser() geeft de ingelogde gebruiker of stopt met 401;
 * - dispatch() kiest de juiste methode bij ?action=...
 */
abstract class Controller
{
    /** Melding bij een databasefout (sommige endpoints gebruiken een algemenere tekst). */
    protected string $databaseErrorMessage = 'Databasefout.';

    protected Request $request;
    protected Session $session;
    private ?array $user = null;
    private ?ImageStorage $images = null;

    /** Request en Session kunnen worden meegegeven (bijv. in tests); anders de echte. */
    public function __construct(?Request $request = null, ?Session $session = null)
    {
        $this->request = $request ?? new Request();
        $this->session = $session ?? new Session();
    }

    /** Wat dit endpoint doet; gooit een HttpException bij fouten. */
    abstract protected function handle(): void;

    public function run(): void
    {
        try {
            $this->handle();
        } catch (HttpException $e) {
            Response::error($e->getMessage(), $e->getStatus());
        } catch (PDOException $e) {
            error_log('Kiekje databasefout: ' . $e->getMessage());
            Response::error($this->databaseErrorMessage, 500);
        } catch (Throwable $e) {
            error_log('Kiekje serverfout: ' . $e); // details alleen in het PHP-log, niet naar de browser
            Response::error('Serverfout.', 500);
        }
    }

    protected function db(): PDO
    {
        return Database::connection();
    }

    protected function images(): ImageStorage
    {
        return $this->images ??= new ImageStorage();
    }

    /**
     * De ingelogde gebruiker als ['id' => int, 'username' => string].
     * @throws HttpException 401 als er niemand (meer) ingelogd is
     */
    protected function currentUser(): array
    {
        if ($this->user !== null) {
            return $this->user;
        }
        $id = $this->session->userId();
        $row = $id ? (new UserRepository($this->db()))->findById($id) : null;
        if (!$row) {
            throw new HttpException('Niet ingelogd', 401);
        }
        return $this->user = ['id' => (int) $row['id'], 'username' => $row['username']];
    }

    /**
     * Roept de methode aan die bij de actie hoort, bijv. ['like' => 'like', 'comment' => 'comment'].
     * Die methodes moeten protected zijn (niet private), anders kan deze basisklasse ze niet aanroepen.
     * @throws HttpException bij een onbekende actie
     */
    protected function dispatch(array $routes, string $action, int $unknownStatus = 400, string $unknownMessage = 'Onbekende actie.'): void
    {
        if (!isset($routes[$action])) {
            throw new HttpException($unknownMessage, $unknownStatus);
        }
        $this->{$routes[$action]}();
    }

    /** Succesvol antwoord: {"success": true, ...$data} */
    protected function ok(array $data = []): void
    {
        Response::json(['success' => true] + $data);
    }
}
