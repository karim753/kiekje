<?php
/**
 * Testdata: een paar nep-accounts die voetbal- en sportnieuws delen (posts, stories, volgers, likes, reacties).
 * De afbeeldingen worden getekend door tools/render_cards.ps1 (Windows, geen PHP-GD nodig).
 *
 *   php backend/tools/seed_sport.php            accounts aanmaken (bestaande accounts worden overgeslagen)
 *   php backend/tools/seed_sport.php --remove   deze accounts + hun foto's weer verwijderen
 *
 * Wachtwoord van alle accounts: Sport1234!
 */

require_once __DIR__ . '/../config/database.php';

const PASSWORD = 'Sport1234!';
$uploads = realpath(__DIR__ . '/../uploads');

$accounts = [
    'voetbalflits' => [
        'initials' => 'VF', 'colors' => ['#0B6E4F', '#08A045'],
        'bio' => 'Snel voetbalnieuws uit binnen- en buitenland ⚽ Volg voor de laatste updates!',
        'posts' => [
            ['BREAKING', 'Klassieker zondag uitverkocht', 'Alle kaarten binnen een uur weg', 'Alle kaarten voor de klassieker van zondag zijn binnen een uur verkocht 🔥 Wie gaat er kijken? #voetbal #klassieker', 'Amsterdam'],
            ['UITSLAGEN', 'Speelronde 7 in één oogopslag', 'Drie thuisoverwinningen, twee gelijke spelen', 'Speelronde 7 zit erop! Welke wedstrijd vond jij het mooist? 👇', null],
            ['STATS', 'Topscorer staat op 9 goals', 'Na slechts zeven wedstrijden', 'Wat een seizoensstart van onze topscorer: al 9 goals na 7 duels ⚽⚽⚽ Haalt hij de 30?', null],
            ['OPSTELLING', 'Oranje-selectie bekend', 'Twee nieuwe namen in de groep', 'De bondscoach heeft zijn selectie bekendgemaakt voor de komende interlands 🇳🇱 Tevreden met de keuzes?', 'Zeist'],
        ],
        'stories' => [['LIVE', 'Rust: 1-1', 'Spannende eerste helft']],
    ],
    'eredivisie.update' => [
        'initials' => 'EU', 'colors' => ['#C1121F', '#780000'],
        'bio' => 'Alles over de Eredivisie: uitslagen, stand en samenvattingen 📊',
        'posts' => [
            ['STAND', 'Koploper loopt uit', 'Voorsprong nu vier punten', 'De koploper profiteert van puntverlies van de achtervolgers. Wordt dit een saaie titelrace of komt er nog spanning? 🤔', null],
            ['PREVIEW', 'Topper in Eindhoven', 'Zaterdag 18:45 uur', 'Zaterdag de topper van de week! Wat is jouw voorspelling? Laat je score achter in de reacties ⬇️', 'Eindhoven'],
            ['DOELPUNT', 'Goal van de maand', 'Stem op jouw favoriet', 'Vier kandidaten voor de goal van de maand. Welke is jouw favoriet: 1, 2, 3 of 4? 🎯', null],
        ],
        'stories' => [['POLL', 'Wie wordt kampioen?', 'Stuur je antwoord via DM'], ['VANDAAG', '3 wedstrijden', 'Vanaf 14:30 uur']],
    ],
    'transfer_radar' => [
        'initials' => 'TR', 'colors' => ['#1D3557', '#457B9D'],
        'bio' => 'Transfergeruchten en officiële deals 📡 Here we go? Wij houden je op de hoogte.',
        'posts' => [
            ['GERUCHT', 'Middenvelder op weg naar Engeland', 'Onderhandelingen in vergevorderd stadium', 'Volgens bronnen zijn de gesprekken over een transfer naar de Premier League in een vergevorderd stadium 👀 Blijven of gaan?', null],
            ['OFFICIEEL', 'Jeugdspeler tekent eerste contract', 'Verbonden tot medio 2029', 'OFFICIEEL ✍️ Een van de grootste talenten uit de jeugdopleiding heeft zijn eerste profcontract getekend.', 'Rotterdam'],
            ['DEADLINE DAY', 'Nog 12 uur tot de deadline', 'Welke club slaat nog toe?', 'Deadline day! ⏰ Nog 12 uur om transfers af te ronden. Welke deal verwacht jij nog?', null],
        ],
        'stories' => [['HERE WE GO?', 'Medische keuring gepland', 'Meer nieuws volgt']],
    ],
    'sportpraat.nl' => [
        'initials' => 'SP', 'colors' => ['#F77F00', '#D62828'],
        'bio' => 'Sportnieuws in het algemeen: F1 🏎️ tennis 🎾 wielrennen 🚴 en meer',
        'posts' => [
            ['FORMULE 1', 'Pole position op zaterdag', 'Nieuw baanrecord in de kwalificatie', 'Wat een ronde in de kwalificatie! Pole position én een nieuw baanrecord 🏎️💨 Morgen de race, wie wint er?', 'Zandvoort'],
            ['TENNIS', 'Door naar de kwartfinale', 'Zege in drie sets', 'Knappe overwinning in drie sets, door naar de kwartfinale 🎾 #tennis', null],
            ['WIELRENNEN', 'Etappezege na lange solo', '45 kilometer alleen op kop', 'Wat een aanval! 45 kilometer solo en toch de etappe gewonnen 🚴‍♂️ Koers op z\'n mooist.', null],
            ['SCHAATSEN', 'Seizoen van start in Thialf', 'Eerste wedstrijden dit weekend', 'Het schaatsseizoen begint weer ⛸️ Dit weekend de eerste wedstrijden in Thialf. Ga jij kijken?', 'Heerenveen'],
        ],
        'stories' => [['NU LIVE', 'Laatste ronde', 'Het blijft spannend tot de finish']],
    ],
    // fanaccount met echte foto's met een vrije licentie van Wikimedia Commons (fotograaf + licentie in het bijschrift)
    'palmer.fanpage' => [
        'initials' => 'CP', 'colors' => ['#034694', '#001F5B'],
        'bio' => 'Fanaccount (niet officieel) 🥶 Alles over Cole Palmer. Foto\'s via Wikimedia Commons.',
        'photos' => [
            ['ColePalmervsLeicester.jpg', 'Cold Palmer aan het werk 🥶 #CP20', 'Leicester'],
            ['Cole Palmer (Chelsea) vs Leicester City, 9th March 2025 (cropped).jpg', 'Stamford Bridge, altijd een feest als hij aan de bal is 💙', 'Londen'],
            ['Cole Palmer 20042025 (1).jpg', 'Aankomst op Craven Cottage. Focus. 🎧', 'Londen'],
            ['Cole Palmer making pass vs Southampton crowd view.jpg', 'Die passing range 🎯 Wie heeft dit live gezien?', 'Londen'],
            ['ColePalmer22.jpg', 'Throwback naar zijn tijd bij Manchester City 🩵', 'Manchester'],
            ['Yokohama F. Marinos - Manchester City (3-5) - 53075276869 (Cole Palmer).jpg', 'Throwback: preseason-tour in Japan 🇯🇵', 'Tokio'],
        ],
        'stories' => [['MATCHDAY', 'Palmer start vandaag', 'Wie scoort er? 👇']],
    ],
];

// reacties die de accounts op elkaars posts plaatsen
$comments = ['Mooi nieuws!', 'Eindelijk 🙌', 'Dit gaat een mooi seizoen worden', 'Ik zeg 2-1', 'Geen verrassing eigenlijk', 'Wat een actie 🔥', 'Bedankt voor de update!', 'Benieuwd hoe dit afloopt 👀'];

$pdo = getPDO();
$names = array_keys($accounts);

// ---------- verwijderen ----------
if (in_array('--remove', $argv, true)) {
    $in = implode(',', array_fill(0, count($names), '?'));
    $files = $pdo->prepare("SELECT avatar_url AS f FROM users WHERE username IN ($in)
        UNION ALL SELECT p.image_url FROM posts p JOIN users u ON u.id = p.user_id WHERE u.username IN ($in)
        UNION ALL SELECT s.image_url FROM stories s JOIN users u ON u.id = s.user_id WHERE u.username IN ($in)");
    $files->execute([...$names, ...$names, ...$names]);
    foreach ($files->fetchAll(PDO::FETCH_COLUMN) as $f) {
        if ($f && preg_match('#^uploads/([a-f0-9]{32}\.jpg)$#', $f, $m)) {
            @unlink("$uploads/{$m[1]}");
        }
    }
    $del = $pdo->prepare("DELETE FROM users WHERE username IN ($in)");
    $del->execute($names);
    echo "Verwijderd: {$del->rowCount()} account(s).\n";
    exit(0);
}

// ---------- afbeeldingen tekenen ----------
$existing = $pdo->prepare('SELECT username FROM users WHERE username = ?');
$todo = array_filter($accounts, function ($name) use ($existing) {
    $existing->execute([$name]);
    return !$existing->fetchColumn();
}, ARRAY_FILTER_USE_KEY);
foreach (array_diff($names, array_keys($todo)) as $name) {
    echo "Overgeslagen (bestaat al): $name\n";
}
if (!$todo) {
    exit(0);
}

$spec = [];
$card = function (string $name, string $kind, array $a, array $item = ['', '', '']) use (&$spec) {
    $file = $kind . '-' . preg_replace('/\W/', '', $name) . '-' . count($spec) . '.jpg';
    $spec[] = [
        'file' => $file, 'kind' => $kind, 'bg1' => $a['colors'][0], 'bg2' => $a['colors'][1],
        'tag' => $item[0], 'title' => $kind === 'avatar' ? $a['initials'] : $item[1], 'sub' => $item[2], 'handle' => $name,
    ];
    return $file;
};
foreach ($todo as $name => &$a) {
    $a['avatar_file'] = $card($name, 'avatar', $a);
    $a['posts'] ??= [];
    foreach ($a['posts'] as &$p) {
        $p['file'] = $card($name, 'post', $a, $p);
    }
    foreach ($a['stories'] as &$s) {
        $s['file'] = $card($name, 'story', $a, $s);
    }
    unset($p, $s);
}
unset($a);

$tmp = sys_get_temp_dir() . '/kiekje_sport_' . bin2hex(random_bytes(4));
mkdir($tmp);
file_put_contents("$tmp/spec.json", json_encode($spec, JSON_UNESCAPED_UNICODE));
$script = realpath(__DIR__ . '/../../tools/render_cards.ps1');
passthru('powershell -NoProfile -ExecutionPolicy Bypass -File ' . escapeshellarg($script) . ' ' . escapeshellarg("$tmp/spec.json") . ' ' . escapeshellarg("$tmp/out"), $code);
if ($code !== 0) {
    fwrite(STDERR, "Afbeeldingen tekenen mislukt.\n");
    exit(1);
}
// naar backend/uploads kopiëren onder een willekeurige naam (zoals ImageStorage dat ook doet)
$store = function (string $file) use ($tmp, $uploads) {
    $name = bin2hex(random_bytes(16)) . '.jpg';
    copy("$tmp/out/$file", "$uploads/$name");
    return "uploads/$name";
};

// echte foto's downloaden van Wikimedia Commons + fotograaf en licentie ophalen
// (eerst naar de tijdelijke map; pas bij het vullen van de database naar backend/uploads)
$commons = function (string $title) use ($tmp) {
    $ctx = stream_context_create(['http' => [
        'protocol_version' => 1.1, 'timeout' => 30,
        'header' => "User-Agent: KiekjeSeed/1.0 (lokaal schoolproject, testdata)\r\nConnection: close\r\n",
    ]]);
    $info = function (array $extra) use ($title, $ctx) {
        $api = 'https://commons.wikimedia.org/w/api.php?' . http_build_query([
            'action' => 'query', 'format' => 'json', 'titles' => "File:$title", 'prop' => 'imageinfo',
        ] + $extra);
        return current(json_decode((string) @file_get_contents($api, false, $ctx), true)['query']['pages'] ?? [])['imageinfo'][0] ?? null;
    };
    // Wikimedia weigert het downloaden van originelen (HTTP 429), dus altijd een echte miniatuur
    // vragen die smaller is dan het origineel (max. 1080 px breed)
    $meta = $info(['iiprop' => 'size|extmetadata']);
    $thumb = $meta ? $info(['iiprop' => 'url', 'iiurlwidth' => min(1080, $meta['width'] - 1)]) : null;
    $bytes = false;
    for ($try = 0; $thumb && $try < 4 && !$bytes; $try++) {
        sleep($try ? 5 * $try : 1);
        $bytes = @file_get_contents($thumb['thumburl'], false, $ctx);
    }
    $info = $meta;
    if (!$bytes || !str_starts_with($bytes, "\xFF\xD8")) {
        throw new RuntimeException("Foto downloaden mislukt: $title");
    }
    $name = 'photo-' . md5($title) . '.jpg';
    file_put_contents("$tmp/out/$name", $bytes);
    $meta = $info['extmetadata'];
    $artist = trim(html_entity_decode(strip_tags($meta['Artist']['value'] ?? 'onbekend')));
    $license = trim(strip_tags($meta['LicenseShortName']['value'] ?? ''));
    return [$name, "📸 $artist, $license (Wikimedia Commons)"];
};
foreach ($todo as $name => &$a) {
    foreach ($a['photos'] ?? [] as &$ph) {
        [$ph['path'], $ph['credit']] = $commons($ph[0]);
    }
    unset($ph);
}
unset($a);

// ---------- database vullen ----------
$pdo->beginTransaction();
$ids = [];
$postIds = [];
$hash = password_hash(PASSWORD, PASSWORD_BCRYPT, ['cost' => 12]);
$hoursAgo = fn(float $h) => date('Y-m-d H:i:s', time() - (int) ($h * 3600));
foreach ($todo as $name => $a) {
    $pdo->prepare('INSERT INTO users (username, email, password_hash, bio, avatar_url, created_at) VALUES (?, ?, ?, ?, ?, ?)')
        ->execute([$name, preg_replace('/\W/', '', $name) . '@kiekje.test', $hash, $a['bio'], $store($a['avatar_file']), $hoursAgo(24 * 30)]);
    $ids[$name] = (int) $pdo->lastInsertId();

    foreach ($a['posts'] as $i => $p) {
        $pdo->prepare('INSERT INTO posts (user_id, image_url, caption, location, created_at) VALUES (?, ?, ?, ?, ?)')
            ->execute([$ids[$name], $store($p['file']), $p[3], $p[4], $hoursAgo(random_int(2, 90) + $i * 20)]);
        $postIds[] = [(int) $pdo->lastInsertId(), $ids[$name]];
    }
    foreach ($a['photos'] ?? [] as $i => $ph) {
        $pdo->prepare('INSERT INTO posts (user_id, image_url, caption, location, created_at) VALUES (?, ?, ?, ?, ?)')
            ->execute([$ids[$name], $store($ph['path']), "$ph[1]\n\n$ph[credit]", $ph[2], $hoursAgo(random_int(2, 30) + $i * 18)]);
        $postIds[] = [(int) $pdo->lastInsertId(), $ids[$name]];
    }
    foreach ($a['stories'] as $s) {
        $pdo->prepare('INSERT INTO stories (user_id, image_url, created_at) VALUES (?, ?, ?)')
            ->execute([$ids[$name], $store($s['file']), $hoursAgo(random_int(1, 20))]);
    }
}
// alle sportaccounts (ook eerder aangemaakte) volgen elkaar, liken en reageren op elkaars posts
$all = $pdo->prepare('SELECT id FROM users WHERE username IN (' . implode(',', array_fill(0, count($names), '?')) . ')');
$all->execute($names);
$sportIds = array_map('intval', $all->fetchAll(PDO::FETCH_COLUMN));
foreach ($sportIds as $a) {
    foreach ($sportIds as $b) {
        if ($a !== $b) {
            $pdo->prepare('INSERT IGNORE INTO follows (follower_id, following_id) VALUES (?, ?)')->execute([$a, $b]);
        }
    }
}
foreach ($postIds as [$postId, $owner]) {
    foreach ($sportIds as $u) {
        if ($u !== $owner && random_int(0, 2) > 0) {
            $pdo->prepare('INSERT IGNORE INTO likes (post_id, user_id) VALUES (?, ?)')->execute([$postId, $u]);
        }
        if ($u !== $owner && random_int(0, 3) === 0) {
            $pdo->prepare('INSERT INTO comments (post_id, user_id, content) VALUES (?, ?, ?)')->execute([$postId, $u, $comments[array_rand($comments)]]);
        }
    }
}
$pdo->commit();

array_map('unlink', glob("$tmp/out/*"));
@rmdir("$tmp/out");
@unlink("$tmp/spec.json");
@rmdir($tmp);

echo 'Aangemaakt: ' . implode(', ', array_keys($todo)) . " (wachtwoord: " . PASSWORD . ")\n";
