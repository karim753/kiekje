<?php

namespace Kiekje\Repositories;

/** Volgrelaties tussen gebruikers. */
class FollowRepository extends Repository
{
    public function isFollowing(int $followerId, int $followingId): bool
    {
        return (bool) $this->value('SELECT 1 FROM follows WHERE follower_id = ? AND following_id = ? LIMIT 1', [$followerId, $followingId]);
    }

    /** Volgen of ontvolgen; geeft "follow" of "unfollow" terug. */
    public function toggle(int $followerId, int $followingId): string
    {
        if ($this->isFollowing($followerId, $followingId)) {
            $this->run('DELETE FROM follows WHERE follower_id = ? AND following_id = ?', [$followerId, $followingId]);
            return 'unfollow';
        }
        $this->run('INSERT INTO follows (follower_id, following_id) VALUES (?, ?)', [$followerId, $followingId]);
        return 'follow';
    }
}
