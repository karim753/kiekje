<?php
/**
 * Account: registreren, inloggen, uitloggen, profiel en profielfoto.
 * Alle logica staat in src/Controllers/AuthController.php (zie ook docs/api.md).
 */

require __DIR__ . '/../bootstrap.php';

(new Kiekje\Controllers\AuthController())->run();
