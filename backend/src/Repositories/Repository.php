<?php

namespace Kiekje\Repositories;

use PDO;
use PDOStatement;

/**
 * Basisklasse voor alle repositories: houdt de databaseverbinding vast en biedt korte hulpmethodes.
 * Alle queries gebruiken prepared statements met placeholders (voorkomt SQL-injectie).
 */
abstract class Repository
{
    public function __construct(protected PDO $pdo)
    {
    }

    protected function run(string $sql, array $params = []): PDOStatement
    {
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        return $stmt;
    }

    /** Eén rij of null */
    protected function one(string $sql, array $params = []): ?array
    {
        $row = $this->run($sql, $params)->fetch(PDO::FETCH_ASSOC);
        return $row === false ? null : $row;
    }

    /** Alle rijen */
    protected function all(string $sql, array $params = []): array
    {
        return $this->run($sql, $params)->fetchAll(PDO::FETCH_ASSOC);
    }

    /** Eén waarde (eerste kolom van de eerste rij) of false */
    protected function value(string $sql, array $params = []): mixed
    {
        return $this->run($sql, $params)->fetchColumn();
    }

    /** Eén kolom van alle rijen als lijst */
    protected function column(string $sql, array $params = []): array
    {
        return $this->run($sql, $params)->fetchAll(PDO::FETCH_COLUMN);
    }

    protected function lastId(): int
    {
        return (int) $this->pdo->lastInsertId();
    }

    /** "?, ?, ?" voor een IN (...)-lijst */
    protected static function placeholders(array $values): string
    {
        return implode(',', array_fill(0, count($values), '?'));
    }
}
