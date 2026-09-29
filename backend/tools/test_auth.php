<?php
// Eenvoudig testscript voor register/login via CLI of browser.
// Gebruik: php backend/tools/test_auth.php register
// of: http POST http://localhost/.../auth.php?action=register ...

require_once __DIR__ . '/../config/database.php';

$pdo = getPDO();
$mode = $argv[1] ?? '';

if ($mode === 'register'){
    $username = $argv[2] ?? 'testuser'.rand(1000,9999);
    $email = $argv[3] ?? $username.'@example.com';
    $password = $argv[4] ?? 'geheim1234';

    $hash = password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);
    try{
        $stmt = $pdo->prepare('INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)');
        $stmt->execute([$username, $email, $hash]);
        echo "Created user: {$username} ({$email})\n";
    }catch(PDOException $e){
        echo "Error: " . $e->getMessage() . "\n";
    }
    exit;
}

if ($mode === 'login'){
    $identifier = $argv[2] ?? '';
    $password = $argv[3] ?? '';
    if(!$identifier || !$password){ echo "Usage: php test_auth.php login <identifier> <password>\n"; exit(1); }
    $stmt = $pdo->prepare('SELECT id, username, password_hash FROM users WHERE email = ? OR username = ?');
    $stmt->execute([$identifier, $identifier]);
    $user = $stmt->fetch();
    if(!$user){ echo "No such user\n"; exit(1); }
    if(password_verify($password, $user['password_hash'])){ echo "Login OK for {$user['username']}\n"; } else { echo "Invalid password\n"; }
    exit;
}

echo "Usage: php test_auth.php [register|login] ...\n";
