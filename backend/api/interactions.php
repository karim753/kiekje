<?php
/**
 * Likes en reacties.
 * Alle logica staat in src/Controllers/InteractionController.php (zie ook docs/api.md).
 */

require __DIR__ . '/../bootstrap.php';

(new Kiekje\Controllers\InteractionController())->run();
