<?php
/**
 * Stories (24 uur zichtbaar).
 * Alle logica staat in src/Controllers/StoryController.php (zie ook docs/api.md).
 */

require __DIR__ . '/../bootstrap.php';

(new Kiekje\Controllers\StoryController())->run();
