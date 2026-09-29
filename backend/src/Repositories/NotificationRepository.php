<?php

namespace Kiekje\Repositories;

/**
 * Meldingen, afgeleid uit bestaande activiteit (geen eigen tabel):
 * likes en reacties op jouw posts, likes op jouw reacties, nieuwe volgers en likes op jouw stories.
 */
class NotificationRepository extends Repository
{
    public function forUser(int $meId, int $limit = 30): array
    {
        $rows = $this->all("
            SELECT * FROM (
                SELECT 'like' AS type, u.username AS actor, u.avatar_url AS avatar, l.post_id AS post_id,
                       NULL AS text, p.image_url AS image, l.created_at
                FROM likes l JOIN posts p ON p.id = l.post_id JOIN users u ON u.id = l.user_id
                WHERE p.user_id = ? AND l.user_id <> ?
                UNION ALL
                SELECT 'comment', u.username, u.avatar_url, c.post_id, c.content, p.image_url, c.created_at
                FROM comments c JOIN posts p ON p.id = c.post_id JOIN users u ON u.id = c.user_id
                WHERE p.user_id = ? AND c.user_id <> ?
                UNION ALL
                SELECT 'follow', u.username, u.avatar_url, NULL, NULL, NULL, f.created_at
                FROM follows f JOIN users u ON u.id = f.follower_id
                WHERE f.following_id = ?
                UNION ALL
                SELECT 'story_like', u.username, u.avatar_url, NULL, NULL, s.image_url, sl.created_at
                FROM story_likes sl JOIN stories s ON s.id = sl.story_id JOIN users u ON u.id = sl.user_id
                WHERE s.user_id = ? AND sl.user_id <> ?
                UNION ALL
                SELECT 'comment_like', u.username, u.avatar_url, c.post_id, c.content, p.image_url, cl.created_at
                FROM comment_likes cl JOIN comments c ON c.id = cl.comment_id JOIN posts p ON p.id = c.post_id
                     JOIN users u ON u.id = cl.user_id
                WHERE c.user_id = ? AND cl.user_id <> ?
            ) n
            ORDER BY n.created_at DESC
            LIMIT " . (int) $limit, array_fill(0, 9, $meId));

        // wie volg ik al (voor de knop "Terugvolgen")
        $following = array_flip((new UserRepository($this->pdo))->followingNames($meId));

        return array_map(fn($r) => [
            'type' => $r['type'],
            'actor' => $r['actor'],
            'avatar' => $r['avatar'],
            'post_id' => $r['post_id'] !== null ? (int) $r['post_id'] : null,
            'text' => $r['text'],
            'image' => $r['image'],
            'i_follow' => isset($following[$r['actor']]),
            'created_at' => $r['created_at'],
        ], $rows);
    }
}
