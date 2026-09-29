<?php

namespace Kiekje\Controllers;

use Kiekje\Core\HttpException;
use Kiekje\Core\Validator;
use Kiekje\Repositories\PostRepository;

/**
 * Posts (api/posts.php).
 *   GET                  feed  |  ?user=<naam>  posts van één gebruiker  |  ?id=<id>  één post met alle reacties
 *                        |  ?liked=1  posts die je zelf hebt geliked
 *   POST                 {image, caption, location}  nieuwe post
 *   POST ?action=update  {id, caption}               eigen bijschrift wijzigen
 *   POST ?action=delete  {id}                        eigen post verwijderen
 */
class PostController extends Controller
{
    private PostRepository $posts;
    private array $me;

    protected function handle(): void
    {
        $this->me = $this->currentUser();
        $this->posts = new PostRepository($this->db());

        if ($this->request->method() === 'GET') {
            $this->show();
            return;
        }
        if (!$this->request->isPost()) {
            throw new HttpException('Methode niet toegestaan.', 405);
        }
        $this->dispatch(['create' => 'create', 'update' => 'update', 'delete' => 'delete'], $this->request->action('create'));
    }

    protected function show(): void
    {
        if ($this->request->hasQuery('id')) {
            $post = $this->posts->find($this->me['id'], (int) $this->request->query('id'));
            if (!$post) {
                throw new HttpException('Post niet gevonden.', 404);
            }
            $this->ok(['post' => $post]);
        } elseif ($this->request->hasQuery('liked')) {
            $this->ok(['posts' => $this->posts->likedBy($this->me['id'])]);
        } elseif ($this->request->hasQuery('user')) {
            $this->ok(['posts' => $this->posts->byUser($this->me['id'], trim($this->request->query('user')))]);
        } else {
            $this->ok(['posts' => $this->posts->feed($this->me['id'])]);
        }
    }

    protected function create(): void
    {
        $caption = $this->request->text('caption');
        $location = $this->request->text('location') ?: null;
        Validator::required($this->request->input('image'), 'Afbeelding is verplicht.');
        Validator::maxLength($caption, 2200, 'Bijschrift is te lang (max. 2200 tekens).');
        Validator::maxLength((string) $location, 100, 'Locatie is te lang (max. 100 tekens).');

        $path = $this->images()->save((string) $this->request->input('image'));
        $id = $this->posts->create($this->me['id'], $path, $caption, $location);
        $this->ok(['post' => $this->posts->find($this->me['id'], $id)]);
    }

    protected function update(): void
    {
        $post = $this->ownPost();
        $caption = $this->request->text('caption');
        Validator::maxLength($caption, 2200, 'Bijschrift is te lang (max. 2200 tekens).');
        $this->posts->updateCaption((int) $post['id'], $caption);
        $this->ok();
    }

    protected function delete(): void
    {
        $post = $this->ownPost();
        $this->posts->delete((int) $post['id']);
        $this->images()->delete($post['image_url']);
        $this->ok();
    }

    /** De post uit de body, maar alleen als die van de ingelogde gebruiker is. */
    protected function ownPost(): array
    {
        $post = $this->posts->owner($this->request->int('id'));
        if (!$post) {
            throw new HttpException('Post niet gevonden.', 404);
        }
        if ((int) $post['user_id'] !== $this->me['id']) {
            throw new HttpException('Dit is niet jouw post.', 403);
        }
        return $post;
    }
}
