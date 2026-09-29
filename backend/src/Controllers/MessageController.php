<?php

namespace Kiekje\Controllers;

use Kiekje\Core\HttpException;
use Kiekje\Core\Validator;
use Kiekje\Repositories\MessageRepository;
use Kiekje\Repositories\UserRepository;

/**
 * Directe berichten (api/messages.php).
 *   GET  ?action=conversations      gesprekken met laatste bericht + ongelezen
 *   GET  ?action=list&user=<naam>   gesprek met één gebruiker (markeert als gelezen)
 *   GET  ?action=unread             totaal aantal ongelezen berichten
 *   POST ?action=send {recipient, text}
 * Elk antwoord bevat "me": de gebruiker die de server als ingelogd ziet.
 */
class MessageController extends Controller
{
    protected string $databaseErrorMessage = 'Databasefout';
    private array $me;
    private MessageRepository $messages;
    private UserRepository $users;

    protected function handle(): void
    {
        $this->me = $this->currentUser();
        $this->messages = new MessageRepository($this->db());
        $this->users = new UserRepository($this->db());
        $this->dispatch([
            'conversations' => 'conversations',
            'unread' => 'unread',
            'list' => 'thread',
            'send' => 'send',
        ], $this->request->action(), 400, 'Onbekende actie');
    }

    protected function conversations(): void
    {
        $this->ok(['me' => $this->me['username'], 'conversations' => $this->messages->conversations($this->me['id'])]);
    }

    protected function unread(): void
    {
        $this->ok(['me' => $this->me['username'], 'unread' => $this->messages->unreadCount($this->me['id'])]);
    }

    protected function thread(): void
    {
        $name = trim($this->request->query('user', ''));
        Validator::required($name, 'Gebruiker ontbreekt', 400);
        $other = $this->users->findByUsername($name);
        if (!$other) {
            throw new HttpException('Gebruiker niet gevonden', 404);
        }
        $otherId = (int) $other['id'];
        $this->messages->markRead($otherId, $this->me['id']);

        $myName = $this->me['username'];
        $this->ok(['me' => $myName, 'messages' => array_map(function (array $m) use ($myName, $other) {
            $mine = (int) $m['sender_id'] === $this->me['id'];
            return [
                'id' => (int) $m['id'],
                'sender' => $mine ? $myName : $other['username'],
                'recipient' => $mine ? $other['username'] : $myName,
                'text' => $m['text'],
                'mine' => $mine,
                'created_at' => $m['created_at'],
                'read' => $m['read_at'] !== null,
            ];
        }, $this->messages->thread($this->me['id'], $otherId))]);
    }

    protected function send(): void
    {
        if (!$this->request->isPost()) {
            throw new HttpException('Gebruik POST', 405);
        }
        $recipient = $this->request->text('recipient');
        $text = $this->request->text('text');
        if ($recipient === '' || $text === '') {
            throw new HttpException('Bericht of ontvanger ontbreekt', 400);
        }
        Validator::maxLength($text, 2000, 'Bericht is te lang (max. 2000 tekens)');

        $other = $this->users->findByUsername($recipient);
        if (!$other) {
            throw new HttpException('Ontvanger niet gevonden', 404);
        }
        if ((int) $other['id'] === $this->me['id']) {
            throw new HttpException('Je kunt geen bericht naar jezelf sturen', 422);
        }
        $this->ok(['message_id' => $this->messages->send($this->me['id'], (int) $other['id'], $text)]);
    }
}
