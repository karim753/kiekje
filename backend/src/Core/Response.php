<?php

namespace Kiekje\Core;

/** Stuurt JSON-antwoorden naar de browser. */
class Response
{
    public static function json(array $data, int $status = 200): void
    {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');
        header('Cache-Control: no-store'); // privégegevens (DM's, meldingen) nooit in een cache bewaren
        echo json_encode($data);
    }

    public static function error(string $message, int $status): void
    {
        self::json(['success' => false, 'error' => $message], $status);
    }
}
