-- Kiekje database schema
-- Correspondeert met diagrams/erd.svg

CREATE DATABASE IF NOT EXISTS kiekje CHARACTER SET utf8mb4;
USE kiekje;

CREATE TABLE users (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    username        VARCHAR(30)  NOT NULL UNIQUE,
    email           VARCHAR(150) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,   -- bcrypt hash + salt (password_hash())
    bio             VARCHAR(160) DEFAULT '',
    avatar_url      VARCHAR(255) DEFAULT NULL,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE posts (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    user_id     INT NOT NULL,
    image_url   TEXT NOT NULL,           -- pad in backend/uploads (oudere posts: data-URL)
    caption     VARCHAR(2200) DEFAULT '',
    location    VARCHAR(100) DEFAULT NULL,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE likes (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    post_id     INT NOT NULL,
    user_id     INT NOT NULL,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_like (post_id, user_id),
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE comments (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    post_id     INT NOT NULL,
    user_id     INT NOT NULL,
    content     VARCHAR(500) NOT NULL,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE follows (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    follower_id     INT NOT NULL,   -- de gebruiker die volgt
    following_id    INT NOT NULL,   -- de gebruiker die gevolgd wordt
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_follow (follower_id, following_id),
    FOREIGN KEY (follower_id)  REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE messages (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    sender_id      INT NOT NULL,
    recipient_id   INT NOT NULL,
    text           VARCHAR(2000) NOT NULL,
    created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
    read_at        DATETIME DEFAULT NULL,   -- NULL = nog niet gelezen door ontvanger
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE stories (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    user_id     INT NOT NULL,
    image_url   VARCHAR(255) NOT NULL,   -- pad in backend/uploads
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,   -- 24 uur zichtbaar
    INDEX idx_stories_created (created_at),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE story_likes (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    story_id    INT NOT NULL,
    user_id     INT NOT NULL,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_story_like (story_id, user_id),
    FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id)  REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE comment_likes (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    comment_id  INT NOT NULL,
    user_id     INT NOT NULL,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_comment_like (comment_id, user_id),
    FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id)    REFERENCES users(id) ON DELETE CASCADE
);
