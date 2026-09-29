<?php

namespace Kiekje\Core;

use PDO;

/**
 * Eén gedeelde databaseverbinding per verzoek (singleton).
 * De instellingen (DB_HOST, DB_NAME, ...) staan in config/database.php.
 */
class Database
{
    private static ?PDO $pdo = null;

    public static function connection(): PDO
    {
        if (self::$pdo === null) {
            require_once __DIR__ . '/../../config/database.php';
            self::$pdo = getPDO();
        }
        return self::$pdo;
    }
}
