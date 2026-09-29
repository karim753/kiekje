<?php
require_once __DIR__ . '/../config/database.php';
$pdo = getPDO();
$username = $argv[1] ?? '';
if (!$username) {
    echo "Usage: php delete_user.php <username>\n";
    exit(1);
}
$stmt = $pdo->prepare('DELETE FROM users WHERE username = ?');
$stmt->execute([$username]);
$rows = $stmt->rowCount();
if ($rows) {
    echo "Deleted user: $username (rows affected: $rows)\n";
} else {
    echo "No user named $username found.\n";
}
