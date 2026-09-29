<?php
/**
 * Database-verbinding via PDO.
 * PDO met prepared statements voorkomt SQL-injecties (zie api/*.php: overal
 * placeholders "?" i.p.v. losse string-concatenatie).
 */

function getPDO(): PDO
{
    $host = getenv('DB_HOST') ?: '127.0.0.1';
    $db   = getenv('DB_NAME') ?: 'kiekje';
    $user = getenv('DB_USER') ?: 'root';
    $pass = getenv('DB_PASS') ?: '';

    $dsn = "mysql:host={$host};dbname={$db};charset=utf8mb4";

    $options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false, // echte prepared statements op DB-niveau
    ];

    return new PDO($dsn, $user, $pass, $options);
}
