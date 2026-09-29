<?php

namespace Kiekje\Core;

use RuntimeException;

/**
 * Fout die als HTTP-antwoord naar de browser gaat, bijv. 404 "Post niet gevonden.".
 * Controllers gooien deze exceptie; Controller::run() zet hem om in een JSON-antwoord.
 */
class HttpException extends RuntimeException
{
    public function __construct(string $message, private int $status = 400)
    {
        parent::__construct($message);
    }

    public function getStatus(): int
    {
        return $this->status;
    }
}
