<?php

namespace Kiekje\Controllers;

use Kiekje\Core\HttpException;
use Kiekje\Core\Validator;
use Kiekje\Repositories\FollowRepository;
use Kiekje\Repositories\UserRepository;

/**
 * Volgen / ontvolgen (api/follows.php).
 *   POST {username}  ->  {action: "follow"|"unfollow", followers: [...van de ander], following: [...wie jij volgt]}
 */
class FollowController extends Controller
{
    protected function handle(): void
    {
        $me = $this->currentUser();
        $users = new UserRepository($this->db());

        $username = $this->request->text('username');
        Validator::required($username, 'Gebruikersnaam ontbreekt.');
        $target = $users->findByUsername($username);
        if (!$target) {
            throw new HttpException('Gebruiker niet gevonden.', 404);
        }
        $targetId = (int) $target['id'];
        if ($targetId === $me['id']) {
            throw new HttpException('Je kunt jezelf niet volgen.', 422);
        }

        $action = (new FollowRepository($this->db()))->toggle($me['id'], $targetId);
        $this->ok([
            'action' => $action,
            'followers' => $users->followerNames($targetId),
            'following' => $users->followingNames($me['id']),
        ]);
    }
}
