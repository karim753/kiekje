<?php

namespace Kiekje\Core;

/**
 * De PHP-sessie: wie is ingelogd.
 * Cookie is httponly en SameSite=Lax; bij inloggen krijgt de sessie een nieuw id (tegen session fixation).
 */
class Session
{
    public function start(): void
    {
        if (session_status() === PHP_SESSION_NONE) {
            $secure = !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off';
            session_set_cookie_params(['httponly' => true, 'samesite' => 'Lax', 'secure' => $secure]);
            session_start();
        }
    }

    public function userId(): ?int
    {
        $this->start();
        return empty($_SESSION['user_id']) ? null : (int) $_SESSION['user_id'];
    }

    public function login(int $userId): void
    {
        $this->start();
        session_regenerate_id(true);
        $_SESSION['user_id'] = $userId;
    }

    public function logout(): void
    {
        $this->start();
        $_SESSION = [];
        if (ini_get('session.use_cookies')) {
            $p = session_get_cookie_params();
            setcookie(session_name(), '', time() - 42000, $p['path'], $p['domain'], $p['secure'], $p['httponly']);
        }
        session_destroy();
    }
}
