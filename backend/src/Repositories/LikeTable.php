<?php

namespace Kiekje\Repositories;

use InvalidArgumentException;
use PDO;

/**
 * Herbruikbare like-logica voor een koppeltabel tussen gebruiker en item.
 * Wordt gebruikt voor posts (likes), reacties (comment_likes) en stories (story_likes).
 */
class LikeTable extends Repository
{
    // alleen deze combinaties zijn toegestaan; tabel- en kolomnamen komen dus nooit uit invoer
    private const TABLES = ['likes' => 'post_id', 'comment_likes' => 'comment_id', 'story_likes' => 'story_id'];

    private string $column;

    public function __construct(PDO $pdo, private string $table)
    {
        parent::__construct($pdo);
        if (!isset(self::TABLES[$table])) {
            throw new InvalidArgumentException("Onbekende like-tabel: $table");
        }
        $this->column = self::TABLES[$table];
    }

    /**
     * Like aan of uit zetten.
     * @return array{liked: bool, like_count: int}
     */
    public function toggle(int $itemId, int $userId): array
    {
        $exists = $this->value("SELECT id FROM {$this->table} WHERE {$this->column} = ? AND user_id = ?", [$itemId, $userId]);
        if ($exists) {
            $this->run("DELETE FROM {$this->table} WHERE {$this->column} = ? AND user_id = ?", [$itemId, $userId]);
        } else {
            $this->run("INSERT IGNORE INTO {$this->table} ({$this->column}, user_id) VALUES (?, ?)", [$itemId, $userId]);
        }
        return ['liked' => !$exists, 'like_count' => $this->count($itemId)];
    }

    public function count(int $itemId): int
    {
        return (int) $this->value("SELECT COUNT(*) FROM {$this->table} WHERE {$this->column} = ?", [$itemId]);
    }
}
