<?php
/**
 * Startpunt van de backend: laadt klassen automatisch uit src/.
 *
 * Namespace  Kiekje\Core\Database   ->  src/Core/Database.php
 *            Kiekje\Controllers\...  ->  src/Controllers/...
 * Elk bestand in api/ doet alleen: require bootstrap.php en start de juiste controller.
 */

spl_autoload_register(function (string $class): void {
    $prefix = 'Kiekje\\';
    if (strncmp($class, $prefix, strlen($prefix)) !== 0) {
        return;
    }
    $file = __DIR__ . '/src/' . str_replace('\\', '/', substr($class, strlen($prefix))) . '.php';
    if (is_file($file)) {
        require $file;
    }
});
