<?php

namespace Kiekje\Controllers;

use Kiekje\Core\HttpException;
use Kiekje\Core\Validator;
use Kiekje\Repositories\CommentRepository;
use Kiekje\Repositories\LikeTable;
use Kiekje\Repositories\PostRepository;

/**
 * Likes en reacties (api/interactions.php).
 *   ?action=like            {post_id}           like aan/uit
 *   ?action=comment         {post_id, content}  reactie plaatsen
 *   ?action=comments        GET ?post_id=       reacties onder een post
 *   ?action=comment_like    {comment_id}        reactie liken aan/uit
 *   ?action=comment_delete  {comment_id}        eigen reactie, of reactie onder je eigen post, verwijderen
 */
class InteractionController extends Controller
{
    private array $me;
    private PostRepository $posts;
    private CommentRepository $comments;

    protected function handle(): void
    {
        $this->me = $this->currentUser();
        $this->posts = new PostRepository($this->db());
        $this->comments = new CommentRepository($this->db());
        $this->dispatch([
            'like' => 'likePost',
            'comment' => 'comment',
            'comments' => 'listComments',
            'comment_like' => 'likeComment',
            'comment_delete' => 'deleteComment',
        ], $this->request->action(), 404);
    }

    protected function likePost(): void
    {
        $postId = $this->requirePost($this->request->int('post_id'));
        $this->ok((new LikeTable($this->db(), 'likes'))->toggle($postId, $this->me['id']));
    }

    protected function comment(): void
    {
        $postId = $this->request->int('post_id');
        $content = $this->request->text('content');
        Validator::required($content, 'Lege reactie.');
        Validator::maxLength($content, 500, 'Reactie mag maximaal 500 tekens zijn.');
        $this->requirePost($postId);

        $id = $this->comments->create($postId, $this->me['id'], $content);
        $this->ok(['comment' => [
            'id' => $id,
            'user' => $this->me['username'],
            'text' => $content,
            'created_at' => date('Y-m-d H:i:s'),
            'like_count' => 0,
            'liked' => false,
        ]]);
    }

    protected function listComments(): void
    {
        $this->ok(['comments' => $this->comments->forPost((int) $this->request->query('post_id', '0'))]);
    }

    protected function likeComment(): void
    {
        $comment = $this->requireComment();
        $this->ok((new LikeTable($this->db(), 'comment_likes'))->toggle((int) $comment['id'], $this->me['id']));
    }

    protected function deleteComment(): void
    {
        $comment = $this->requireComment();
        $isAuthor = (int) $comment['user_id'] === $this->me['id'];
        $isPostOwner = (int) $comment['post_owner'] === $this->me['id'];
        if (!$isAuthor && !$isPostOwner) {
            throw new HttpException('Je mag deze reactie niet verwijderen.', 403);
        }
        $this->comments->delete((int) $comment['id']);
        $this->ok();
    }

    protected function requirePost(int $postId): int
    {
        if (!$this->posts->exists($postId)) {
            throw new HttpException('Post niet gevonden.', 404);
        }
        return $postId;
    }

    protected function requireComment(): array
    {
        $comment = $this->comments->findWithPostOwner($this->request->int('comment_id'));
        if (!$comment) {
            throw new HttpException('Reactie niet gevonden.', 404);
        }
        return $comment;
    }
}
