<?php
/**
 * Volgen en ontvolgen.
 * Alle logica staat in src/Controllers/FollowController.php (zie ook docs/api.md).
 */

require __DIR__ . '/../bootstrap.php';

(new Kiekje\Controllers\FollowController())->run();
