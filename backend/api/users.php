<?php
/**
 * Zoeken, profielen en voorgestelde accounts.
 * Alle logica staat in src/Controllers/UserController.php (zie ook docs/api.md).
 */

require __DIR__ . '/../bootstrap.php';

(new Kiekje\Controllers\UserController())->run();
