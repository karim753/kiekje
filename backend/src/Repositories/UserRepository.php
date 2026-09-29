<?php

namespace Kiekje\Repositories;

/** Gebruikers: account, profiel, zoeken en voorstellen. */
class UserRepository extends Repository
{
    public function findById(int $id): ?array
    {
        return $this->one('SELECT id, username, email, bio, avatar_url FROM users WHERE id = ?', [$id]);
    }

    public function findByUsername(string $username): ?array
    {
        return $this->one('SELECT id, username, avatar_url FROM users WHERE username = ? LIMIT 1', [$username]);
    }

    /**
     * Zoekt op e-mail óf gebruikersnaam (voor inloggen), inclusief wachtwoord-hash.
     * Past de invoer bij het e-mailadres van de één en de gebruikersnaam van een ander, dan wint het e-mailadres,
     * zodat altijd precies één, voorspelbaar account wordt gecontroleerd.
     */
    public function findForLogin(string $identifier): ?array
    {
        return $this->one('
            SELECT id, username, password_hash FROM users
            WHERE email = ? OR username = ?
            ORDER BY (email = ?) DESC
            LIMIT 1', [$identifier, $identifier, $identifier]);
    }

    /** Maakt een account aan en geeft het nieuwe id terug. (PDOException 23000 = naam/e-mail bestaat al) */
    public function create(string $username, string $email, string $passwordHash): int
    {
        $this->run('INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)', [$username, $email, $passwordHash]);
        return $this->lastId();
    }

    public function updateProfile(int $id, string $username, string $bio): void
    {
        $this->run('UPDATE users SET username = ?, bio = ? WHERE id = ?', [$username, $bio, $id]);
    }

    public function updateAvatar(int $id, ?string $path): void
    {
        $this->run('UPDATE users SET avatar_url = ? WHERE id = ?', [$path, $id]);
    }

    /** Profiel met aantal posts, volgers en wie hij/zij volgt. */
    public function profile(string $username): ?array
    {
        $user = $this->one('
            SELECT u.id, u.username, u.bio, u.avatar_url,
                   (SELECT COUNT(*) FROM posts p WHERE p.user_id = u.id) AS post_count
            FROM users u WHERE u.username = ?', [$username]);
        if (!$user) {
            return null;
        }
        $user['followers'] = $this->followerNames((int) $user['id']);
        $user['following'] = $this->followingNames((int) $user['id']);
        return $user;
    }

    public function followerNames(int $userId): array
    {
        return $this->column('SELECT u.username FROM follows f JOIN users u ON u.id = f.follower_id WHERE f.following_id = ? ORDER BY u.username', [$userId]);
    }

    public function followingNames(int $userId): array
    {
        return $this->column('SELECT u.username FROM follows f JOIN users u ON u.id = f.following_id WHERE f.follower_id = ? ORDER BY u.username', [$userId]);
    }

    /** Zoekt op (een deel van) de gebruikersnaam, zonder jezelf; exacte match eerst. */
    public function search(string $query, int $excludeId): array
    {
        $like = '%' . addcslashes($query, '%_\\') . '%'; // % en _ letterlijk nemen
        return $this->all('
            SELECT u.username, u.avatar_url,
                   (SELECT COUNT(*) FROM follows f WHERE f.following_id = u.id) AS follower_count,
                   (SELECT COUNT(*) FROM posts p WHERE p.user_id = u.id) AS post_count
            FROM users u
            WHERE u.username LIKE ? AND u.id <> ?
            ORDER BY (u.username = ?) DESC, u.username ASC
            LIMIT 30', [$like, $excludeId, $query]);
    }

    /** Max. 5 accounts die je nog niet volgt: wie jou volgt eerst, daarna de populairste. */
    public function suggestions(int $meId): array
    {
        return $this->all('
            SELECT u.username, u.avatar_url,
                   (SELECT COUNT(*) FROM follows f WHERE f.following_id = u.id) AS follower_count,
                   EXISTS(SELECT 1 FROM follows f WHERE f.follower_id = u.id AND f.following_id = ?) AS follows_me
            FROM users u
            WHERE u.id <> ?
              AND NOT EXISTS (SELECT 1 FROM follows f WHERE f.follower_id = ? AND f.following_id = u.id)
            ORDER BY follows_me DESC, follower_count DESC, u.id DESC
            LIMIT 5', [$meId, $meId, $meId]);
    }
}
