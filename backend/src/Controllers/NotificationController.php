<?php

namespace Kiekje\Controllers;

use Kiekje\Repositories\NotificationRepository;

/**
 * Meldingen (api/notifications.php).
 *   GET  ->  {notifications: [{type, actor, avatar, post_id, text, image, i_follow, created_at}]}  (laatste 30)
 */
class NotificationController extends Controller
{
    protected function handle(): void
    {
        $me = $this->currentUser();
        $this->ok(['notifications' => (new NotificationRepository($this->db()))->forUser($me['id'])]);
    }
}
