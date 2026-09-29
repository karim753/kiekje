<?php

namespace Kiekje\Core;

/** Controleert invoer en gooit een HttpException (422) met een duidelijke melding. */
class Validator
{
    public static function username(string $username): void
    {
        $len = mb_strlen($username);
        if ($len < 3 || $len > 30) {
            throw new HttpException('Gebruikersnaam moet 3 tot 30 tekens lang zijn.', 422);
        }
        if (preg_match('/\s/u', $username)) {
            throw new HttpException('Gebruikersnaam mag geen spaties bevatten.', 422);
        }
        // geen @: anders kan iemand het e-mailadres van een ander als gebruikersnaam kiezen (inloggen is op beide)
        if (str_contains($username, '@')) {
            throw new HttpException('Gebruikersnaam mag geen @ bevatten.', 422);
        }
    }

    public static function email(string $email): void
    {
        if (!filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($email) > 150) {
            throw new HttpException('Ongeldig e-mailadres.', 422);
        }
    }

    public static function maxLength(string $value, int $max, string $message): void
    {
        if (mb_strlen($value) > $max) {
            throw new HttpException($message, 422);
        }
    }

    public static function required(mixed $value, string $message, int $status = 422): void
    {
        if ($value === null || $value === '' || $value === []) {
            throw new HttpException($message, $status);
        }
    }
}
