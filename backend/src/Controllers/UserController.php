<?php

namespace Kiekje\Controllers;

use Kiekje\Core\HttpException;
use Kiekje\Repositories\UserRepository;

/**
 * Gebruikers (api/users.php).
 *   GET ?q=<tekst>    zoeken (leeg = iedereen, zonder jezelf)
 *   GET ?user=<naam>  profiel met volgers/volgend
 *   GET ?suggest=1    max. 5 accounts die je nog niet volgt
 */
class UserController extends Controller
{
    private array $me;
    private UserRepository $users;

    protected function handle(): void
    {
        $this->me = $this->currentUser();
        $this->users = new UserRepository($this->db());

        if ($this->request->hasQuery('suggest')) {
            $this->suggestions();
        } elseif ($this->request->hasQuery('user')) {
            $this->profile();
        } else {
            $this->search();
        }
    }

    protected function search(): void
    {
        $rows = $this->users->search(trim($this->request->query('q', '')), $this->me['id']);
        $this->ok(['users' => array_map(fn($r) => [
            'username' => $r['username'],
            'avatar' => $r['avatar_url'],
            'follower_count' => (int) $r['follower_count'],
            'post_count' => (int) $r['post_count'],
        ], $rows)]);
    }

    protected function profile(): void
    {
        $user = $this->users->profile(trim($this->request->query('user')));
        if (!$user) {
            throw new HttpException('Gebruiker niet gevonden.', 404);
        }
        $this->ok(['user' => [
            'username' => $user['username'],
            'bio' => $user['bio'] ?? '',
            'avatar' => $user['avatar_url'],
            'post_count' => (int) $user['post_count'],
            'followers' => $user['followers'],
            'following' => $user['following'],
            'is_me' => (int) $user['id'] === $this->me['id'],
            'i_follow' => in_array($this->me['username'], $user['followers'], true),
        ]]);
    }

    protected function suggestions(): void
    {
        $this->ok(['users' => array_map(fn($r) => [
            'username' => $r['username'],
            'avatar' => $r['avatar_url'],
            'follower_count' => (int) $r['follower_count'],
            'follows_me' => (bool) $r['follows_me'],
        ], $this->users->suggestions($this->me['id']))]);
    }
}
