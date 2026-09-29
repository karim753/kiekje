<?php

namespace Kiekje\Repositories;

/** Stories: 24 uur zichtbaar. */
class StoryRepository extends Repository
{
    public const HOURS = 24;

    /**
     * Alle actieve stories, per gebruiker bij elkaar (zoals Instagram ze afspeelt):
     * eerst je eigen, dan de gebruiker met de nieuwste story; binnen een gebruiker oudste eerst.
     */
    public function active(int $meId): array
    {
        $rows = $this->all('
            SELECT s.id, s.user_id, s.image_url, s.created_at, u.username, u.avatar_url,
                   (SELECT COUNT(*) FROM story_likes l WHERE l.story_id = s.id) AS like_count,
                   EXISTS(SELECT 1 FROM story_likes l WHERE l.story_id = s.id AND l.user_id = ?) AS liked
            FROM stories s JOIN users u ON u.id = s.user_id
            WHERE s.created_at > NOW() - INTERVAL ' . self::HOURS . ' HOUR
            ORDER BY (s.user_id = ?) DESC,
                     (SELECT MAX(s2.created_at) FROM stories s2 WHERE s2.user_id = s.user_id) DESC,
                     s.user_id, s.created_at ASC, s.id ASC', [$meId, $meId]);

        // bij eigen stories: wie heeft ze geliket
        $ownIds = array_map(fn($r) => (int) $r['id'], array_filter($rows, fn($r) => (int) $r['user_id'] === $meId));
        $likers = [];
        if ($ownIds) {
            foreach ($this->all('SELECT l.story_id, u.username FROM story_likes l JOIN users u ON u.id = l.user_id WHERE l.story_id IN (' . self::placeholders($ownIds) . ') ORDER BY l.id', $ownIds) as $row) {
                $likers[(int) $row['story_id']][] = $row['username'];
            }
        }

        return array_map(fn($r) => [
            'id' => (int) $r['id'],
            'user' => $r['username'],
            'avatar' => $r['avatar_url'],
            'img' => $r['image_url'],
            'created_at' => $r['created_at'],
            'like_count' => (int) $r['like_count'],
            'liked' => (bool) $r['liked'],
            'mine' => (int) $r['user_id'] === $meId,
            'likers' => $likers[(int) $r['id']] ?? [],
        ], $rows);
    }

    public function create(int $userId, string $imagePath): int
    {
        $this->run('INSERT INTO stories (user_id, image_url) VALUES (?, ?)', [$userId, $imagePath]);
        return $this->lastId();
    }

    /** Story (ook verlopen) met eigenaar en foto. */
    public function find(int $id): ?array
    {
        return $this->one('SELECT id, user_id, image_url FROM stories WHERE id = ?', [$id]);
    }

    /** Alleen een story die nog geen 24 uur oud is. */
    public function findActive(int $id): ?array
    {
        return $this->one('SELECT id, user_id, image_url FROM stories WHERE id = ? AND created_at > NOW() - INTERVAL ' . self::HOURS . ' HOUR', [$id]);
    }

    public function delete(int $id): void
    {
        $this->run('DELETE FROM stories WHERE id = ?', [$id]);
    }
}
