<?php
$pdo = new PDO('mysql:host=127.0.0.1;dbname=kiekje;charset=utf8mb4', 'root', '');
$prefix = 'follow_verify_' . time();
$u1 = $prefix . '_a';
$u2 = $prefix . '_b';
$pdo->exec("INSERT INTO users (username, email, password_hash) VALUES ('{$u1}', '{$u1}@example.com', 'hash')");
$pdo->exec("INSERT INTO users (username, email, password_hash) VALUES ('{$u2}', '{$u2}@example.com', 'hash')");
$me = $pdo->query("SELECT id FROM users WHERE username = '{$u1}'")->fetchColumn();
$target = $pdo->query("SELECT id FROM users WHERE username = '{$u2}'")->fetchColumn();
$pdo->exec("INSERT INTO follows (follower_id, following_id) VALUES ({$me}, {$target})");
$stmt = $pdo->query("SELECT u1.username AS follower, u2.username AS following FROM follows f JOIN users u1 ON u1.id = f.follower_id JOIN users u2 ON u2.id = f.following_id WHERE u1.username = '{$u1}' AND u2.username = '{$u2}'");
foreach ($stmt as $row) {
    echo $row['follower'] . ' -> ' . $row['following'] . PHP_EOL;
}
