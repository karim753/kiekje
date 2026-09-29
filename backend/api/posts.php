<?php
/**
 * Posts: feed, plaatsen, bewerken, verwijderen.
 * Alle logica staat in src/Controllers/PostController.php (zie ook docs/api.md).
 */

require __DIR__ . '/../bootstrap.php';

(new Kiekje\Controllers\PostController())->run();
