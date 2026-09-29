<?php
/**
 * Directe berichten (DM's).
 * Alle logica staat in src/Controllers/MessageController.php (zie ook docs/api.md).
 */

require __DIR__ . '/../bootstrap.php';

(new Kiekje\Controllers\MessageController())->run();
