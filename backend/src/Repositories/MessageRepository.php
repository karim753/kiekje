<?php

namespace Kiekje\Repositories;

/**
 * Directe berichten (DM's).
 * Let op: echte (niet-geëmuleerde) prepares, dus elke named placeholder maar één keer per query.
 */
class MessageRepository extends Repository
{
    /** Per gesprekspartner het laatste bericht + aantal ongelezen berichten, nieuwste gesprek eerst. */
    public function conversations(int $meId): array
    {
        $rows = $this->all('
            SELECT u.username, u.avatar_url, m.text, m.created_at, m.sender_id,
                   (SELECT COUNT(*) FROM messages x
                     WHERE x.sender_id = u.id AND x.recipient_id = :me3 AND x.read_at IS NULL) AS unread
            FROM messages m
            JOIN (
                SELECT IF(sender_id = :me1, recipient_id, sender_id) AS other_id, MAX(id) AS last_id
                FROM messages
                WHERE sender_id = :me2 OR recipient_id = :me4
                GROUP BY other_id
            ) last ON last.last_id = m.id
            JOIN users u ON u.id = last.other_id
            ORDER BY m.id DESC', [':me1' => $meId, ':me2' => $meId, ':me3' => $meId, ':me4' => $meId]);

        return array_map(fn($r) => [
            'username' => $r['username'],
            'avatar' => $r['avatar_url'],
            'last_text' => $r['text'],
            'last_mine' => (int) $r['sender_id'] === $meId,
            'created_at' => $r['created_at'],
            'unread' => (int) $r['unread'],
        ], $rows);
    }

    public function unreadCount(int $meId): int
    {
        return (int) $this->value('SELECT COUNT(*) FROM messages WHERE recipient_id = ? AND read_at IS NULL', [$meId]);
    }

    /** Berichten van de ander aan mij als gelezen markeren. */
    public function markRead(int $fromId, int $toId): void
    {
        $this->run('UPDATE messages SET read_at = NOW() WHERE sender_id = ? AND recipient_id = ? AND read_at IS NULL', [$fromId, $toId]);
    }

    /** Het hele gesprek tussen twee gebruikers, oudste eerst. */
    public function thread(int $meId, int $otherId): array
    {
        return $this->all('
            SELECT id, sender_id, text, created_at, read_at
            FROM messages
            WHERE (sender_id = ? AND recipient_id = ?) OR (sender_id = ? AND recipient_id = ?)
            ORDER BY id ASC', [$meId, $otherId, $otherId, $meId]);
    }

    public function send(int $fromId, int $toId, string $text): int
    {
        $this->run('INSERT INTO messages (sender_id, recipient_id, text) VALUES (?, ?, ?)', [$fromId, $toId, $text]);
        return $this->lastId();
    }
}
