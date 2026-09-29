<?php

namespace Kiekje\Core;

/** Leest het binnenkomende verzoek: methode, ?query-parameters en de JSON-body. */
class Request
{
    private ?array $body = null;

    public function method(): string
    {
        return $_SERVER['REQUEST_METHOD'] ?? 'GET';
    }

    public function isPost(): bool
    {
        return $this->method() === 'POST';
    }

    /** ?action=... (of de standaardwaarde) */
    public function action(string $default = ''): string
    {
        return (string) ($_GET['action'] ?? $default);
    }

    public function query(string $key, ?string $default = null): ?string
    {
        return isset($_GET[$key]) ? (string) $_GET[$key] : $default;
    }

    public function hasQuery(string $key): bool
    {
        return isset($_GET[$key]);
    }

    /** Waarde uit de JSON-body (null als die ontbreekt). */
    public function input(string $key, mixed $default = null): mixed
    {
        if ($this->body === null) {
            $data = json_decode(file_get_contents('php://input'), true);
            $this->body = is_array($data) ? $data : [];
        }
        return $this->body[$key] ?? $default;
    }

    /** Tekst uit de body, zonder spaties aan begin/eind. */
    public function text(string $key): string
    {
        return trim((string) $this->input($key, ''));
    }

    public function int(string $key): int
    {
        return (int) $this->input($key, 0);
    }
}
