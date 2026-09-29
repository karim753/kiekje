<?php

namespace Kiekje\Controllers;

use Kiekje\Core\HttpException;
use Kiekje\Core\Validator;
use Kiekje\Repositories\LikeTable;
use Kiekje\Repositories\StoryRepository;

/**
 * Stories, 24 uur zichtbaar (api/stories.php).
 *   GET                  alle actieve stories (eigen eerst)
 *   POST                 {image}  nieuwe story
 *   POST ?action=like    {id}     like aan/uit (niet je eigen story)
 *   POST ?action=delete  {id}     eigen story verwijderen
 */
class StoryController extends Controller
{
    private array $me;
    private StoryRepository $stories;

    protected function handle(): void
    {
        $this->me = $this->currentUser();
        $this->stories = new StoryRepository($this->db());

        if ($this->request->method() === 'GET') {
            $this->ok(['stories' => $this->stories->active($this->me['id'])]);
            return;
        }
        if (!$this->request->isPost()) {
            throw new HttpException('Methode niet toegestaan.', 405);
        }
        $this->dispatch(['create' => 'create', 'like' => 'like', 'delete' => 'delete'], $this->request->action('create'));
    }

    protected function create(): void
    {
        Validator::required($this->request->input('image'), 'Afbeelding is verplicht.');
        $path = $this->images()->save((string) $this->request->input('image'));
        $this->ok(['id' => $this->stories->create($this->me['id'], $path)]);
    }

    protected function like(): void
    {
        $story = $this->stories->findActive($this->request->int('id'));
        if (!$story) {
            throw new HttpException('Story niet gevonden of verlopen.', 404);
        }
        if ((int) $story['user_id'] === $this->me['id']) {
            throw new HttpException('Je kunt je eigen story niet liken.', 422);
        }
        $this->ok((new LikeTable($this->db(), 'story_likes'))->toggle((int) $story['id'], $this->me['id']));
    }

    protected function delete(): void
    {
        $story = $this->stories->find($this->request->int('id'));
        if (!$story) {
            throw new HttpException('Story niet gevonden.', 404);
        }
        if ((int) $story['user_id'] !== $this->me['id']) {
            throw new HttpException('Dit is niet jouw story.', 403);
        }
        $this->stories->delete((int) $story['id']);
        $this->images()->delete($story['image_url']);
        $this->ok();
    }
}
