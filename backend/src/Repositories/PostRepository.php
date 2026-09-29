<?php

namespace Kiekje\Repositories;

/** Posts met like-/reactie-aantallen en reacties. */
class PostRepository extends Repository
{
    private const LIMIT = 60;

    /** Feed: alle posts van iedereen, nieuwste eerst (met de laatste 3 reacties). */
    public function feed(int $meId): array
    {
        return $this->fetch($meId, '1 = 1', [], 3);
    }

    public function byUser(int $meId, string $username): array
    {
        return $this->fetch($meId, 'u.username = ?', [$username], 3);
    }

    /** Posts die $meId heeft geliked, laatst gelikete eerst. */
    public function likedBy(int $meId): array
    {
        return $this->fetch(
            $meId,
            'EXISTS(SELECT 1 FROM likes l WHERE l.post_id = p.id AND l.user_id = ?)',
            [$meId],
            3,
            '(SELECT l.created_at FROM likes l WHERE l.post_id = p.id AND l.user_id = ?) DESC, p.id DESC',
            [$meId]
        );
    }

    /** Eén post met álle reacties, of null. */
    public function find(int $meId, int $postId): ?array
    {
        return $this->fetch($meId, 'p.id = ?', [$postId], null)[0] ?? null;
    }

    public function exists(int $postId): bool
    {
        return (bool) $this->value('SELECT 1 FROM posts WHERE id = ?', [$postId]);
    }

    /** Alleen id, eigenaar en foto (voor eigenaarschap-controles en verwijderen). */
    public function owner(int $postId): ?array
    {
        return $this->one('SELECT id, user_id, image_url FROM posts WHERE id = ?', [$postId]);
    }

    public function create(int $userId, string $imagePath, string $caption, ?string $location): int
    {
        $this->run('INSERT INTO posts (user_id, image_url, caption, location) VALUES (?, ?, ?, ?)', [$userId, $imagePath, $caption, $location]);
        return $this->lastId();
    }

    public function updateCaption(int $postId, string $caption): void
    {
        $this->run('UPDATE posts SET caption = ? WHERE id = ?', [$caption, $postId]);
    }

    public function delete(int $postId): void
    {
        $this->run('DELETE FROM posts WHERE id = ?', [$postId]);
    }

    /** Haalt posts op en voegt per post de reacties toe (alle, of alleen de laatste $commentLimit). */
    private function fetch(
        int $meId,
        string $where,
        array $params,
        ?int $commentLimit,
        string $order = 'p.created_at DESC, p.id DESC',
        array $orderParams = []
    ): array {
        // $where en $order komen altijd uit deze klasse, nooit uit invoer; waarden gaan via placeholders
        $rows = $this->all("
            SELECT p.id, p.image_url, p.caption, p.location, p.created_at,
                   u.username, u.avatar_url,
                   (SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id) AS like_count,
                   EXISTS(SELECT 1 FROM likes l WHERE l.post_id = p.id AND l.user_id = ?) AS liked,
                   (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) AS comment_count
            FROM posts p
            JOIN users u ON u.id = p.user_id
            WHERE $where
            ORDER BY $order
            LIMIT " . self::LIMIT, array_merge([$meId], $params, $orderParams));
        if (!$rows) {
            return [];
        }

        $comments = (new CommentRepository($this->pdo))->forPosts(array_map(fn($r) => (int) $r['id'], $rows), $meId);

        return array_map(function (array $r) use ($comments, $commentLimit) {
            $list = $comments[(int) $r['id']] ?? [];
            if ($commentLimit !== null) {
                $list = array_slice($list, -$commentLimit);
            }
            return [
                'id' => (int) $r['id'],
                'user' => $r['username'],
                'avatar' => $r['avatar_url'],
                'img' => $r['image_url'],
                'caption' => $r['caption'] ?? '',
                'loc' => $r['location'],
                'created_at' => $r['created_at'],
                'like_count' => (int) $r['like_count'],
                'liked' => (bool) $r['liked'],
                'comment_count' => (int) $r['comment_count'],
                'comments' => $list,
            ];
        }, $rows);
    }
}
