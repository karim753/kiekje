<?php

namespace Kiekje\Repositories;

/** Reacties onder posts. */
class CommentRepository extends Repository
{
    public function create(int $postId, int $userId, string $content): int
    {
        $this->run('INSERT INTO comments (post_id, user_id, content) VALUES (?, ?, ?)', [$postId, $userId, $content]);
        return $this->lastId();
    }

    /** Reactie met de eigenaar van de post waar hij onder staat (voor de verwijder-regel). */
    public function findWithPostOwner(int $commentId): ?array
    {
        return $this->one('SELECT c.id, c.user_id, p.user_id AS post_owner FROM comments c JOIN posts p ON p.id = c.post_id WHERE c.id = ?', [$commentId]);
    }

    public function delete(int $commentId): void
    {
        $this->run('DELETE FROM comments WHERE id = ?', [$commentId]);
    }

    /** Alle reacties onder één post (eenvoudige lijst). */
    public function forPost(int $postId): array
    {
        return array_map(fn($r) => [
            'id' => (int) $r['id'], 'user' => $r['username'], 'text' => $r['content'], 'created_at' => $r['created_at'],
        ], $this->all('SELECT c.id, c.content, c.created_at, u.username FROM comments c JOIN users u ON u.id = c.user_id WHERE c.post_id = ? ORDER BY c.id ASC', [$postId]));
    }

    /**
     * Reacties voor meerdere posts in één query, gegroepeerd per post-id, met likes.
     * @return array<int, array> post_id => lijst reacties
     */
    public function forPosts(array $postIds, int $meId): array
    {
        if (!$postIds) {
            return [];
        }
        $rows = $this->all('
            SELECT c.id, c.post_id, c.content, c.created_at, u.username,
                   (SELECT COUNT(*) FROM comment_likes cl WHERE cl.comment_id = c.id) AS like_count,
                   EXISTS(SELECT 1 FROM comment_likes cl WHERE cl.comment_id = c.id AND cl.user_id = ?) AS liked
            FROM comments c JOIN users u ON u.id = c.user_id
            WHERE c.post_id IN (' . self::placeholders($postIds) . ')
            ORDER BY c.id ASC', array_merge([$meId], $postIds));

        $grouped = [];
        foreach ($rows as $r) {
            $grouped[(int) $r['post_id']][] = [
                'id' => (int) $r['id'],
                'user' => $r['username'],
                'text' => $r['content'],
                'created_at' => $r['created_at'],
                'like_count' => (int) $r['like_count'],
                'liked' => (bool) $r['liked'],
            ];
        }
        return $grouped;
    }
}
