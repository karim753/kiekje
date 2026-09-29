# Kiekje — API-documentatie

De frontend praat met de backend via JSON over HTTP. Alle endpoints staan in `backend/api/`; elk bestand start
een controller-klasse uit `backend/src/Controllers/` (bijv. `posts.php` → `PostController`).
Basis-URL vanuit de frontend: `../backend/api/` (bijv. `http://localhost/kiekje/kiekje/backend/api/posts.php`).

## Algemeen

- **Formaat**: verzoeken met een body sturen JSON (`Content-Type: application/json`); antwoorden zijn altijd JSON.
- **Inloggen**: na `auth.php?action=login` of `register` zet de server een sessiecookie (`PHPSESSID`, `httponly`,
  `SameSite=Lax`). Die cookie gaat automatisch mee (`fetch(..., { credentials: 'include' })`).
  Alle endpoints behalve `register`, `login` en `me` vereisen een geldige sessie.
- **Fouten**: een HTTP-statuscode ≥ 400 met `{ "success": false, "error": "melding" }`. Dit gebeurt op één plek:
  `Controller::run()` zet elke `HttpException` om in zo'n antwoord (zie `backend/src/Controllers/Controller.php`).

  | Code | Betekenis |
  |---|---|
  | 400 | onbekende actie of ontbrekende gegevens |
  | 401 | niet ingelogd (of onjuiste inloggegevens) |
  | 403 | niet jouw post/story/reactie |
  | 404 | niet gevonden |
  | 405 | verkeerde HTTP-methode |
  | 409 | gebruikersnaam of e-mail bestaat al |
  | 422 | ongeldige invoer (te lang, geen afbeelding, …) |
  | 500 | database-/serverfout |

- **Afbeeldingen** worden als data-URL gestuurd (`data:image/jpeg;base64,...`, ook png/webp/gif, max. 8 MB).
  De server controleert of het echt een afbeelding is, slaat hem op in `backend/uploads/` en geeft het pad terug
  (bijv. `uploads/3f9c…a1.jpg`).
- **Cache**: elk antwoord heeft `Cache-Control: no-store`, zodat privégegevens niet in een cache blijven staan.
- **Beveiliging**: alle queries gebruiken PDO prepared statements; wachtwoorden worden gehasht met bcrypt
  (`password_hash`, cost 12); bij inloggen krijgt de sessie een nieuw id (`session_regenerate_id`).

---

## auth.php — account (`AuthController`)

| Actie | Methode | Body | Antwoord |
|---|---|---|---|
| `?action=register` | POST | `{ username, email, password }` | `{ success, user_id, username }` + sessie |
| `?action=login` | POST | `{ identifier, password }` (gebruikersnaam of e-mail) | `{ success, username }` + sessie |
| `?action=me` | POST | `{}` | `{ success, username, user_id, bio, avatar }` of 401 |
| `?action=update_profile` | POST | `{ username, bio }` | `{ success, username, bio }` |
| `?action=update_avatar` | POST | `{ image }` of `{ remove: true }` | `{ success, avatar }` (pad of `null`) |
| `?action=logout` | POST | `{}` | `{ success }` |

Regels: gebruikersnaam 3–30 tekens zonder spaties en zonder `@`, geldig e-mailadres, wachtwoord minimaal 8 tekens,
bio max. 160 tekens. Alle `auth.php`-acties werken alleen met POST (anders 405). Bij inloggen wint een overeenkomend
e-mailadres van een gelijkluidende gebruikersnaam.

## posts.php — posts (`PostController`)

| Actie | Methode | Parameters / body | Antwoord |
|---|---|---|---|
| feed | GET | – | `{ success, posts: Post[] }` (alle posts, nieuwste eerst, max. 60, laatste 3 reacties per post) |
| posts van gebruiker | GET | `?user=<naam>` | `{ success, posts: Post[] }` |
| gelikete posts | GET | `?liked=1` | `{ success, posts: Post[] }` (posts die je zelf hebt geliked, laatst gelikete eerst, max. 60) |
| één post | GET | `?id=<id>` | `{ success, post: Post }` (met alle reacties) |
| plaatsen | POST | `{ image, caption?, location? }` | `{ success, post: Post }` |
| bijschrift wijzigen | POST | `?action=update`, `{ id, caption }` | `{ success }` (alleen eigen post) |
| verwijderen | POST | `?action=delete`, `{ id }` | `{ success }` (alleen eigen post; foto wordt ook gewist) |

```json
Post = {
  "id": 12, "user": "lisa_natuur", "avatar": "uploads/…jpg", "img": "uploads/…jpg",
  "caption": "…", "loc": "Noorwegen", "created_at": "2026-09-29 10:12:00",
  "like_count": 3, "liked": true, "comment_count": 2,
  "comments": [ { "id": 5, "user": "tim.opreis", "text": "Mooi!", "created_at": "…", "like_count": 1, "liked": false } ]
}
```

## interactions.php — likes en reacties (`InteractionController`)

| Actie | Methode | Body / parameters | Antwoord |
|---|---|---|---|
| `?action=like` | POST | `{ post_id }` | `{ success, liked, like_count }` (aan/uit) |
| `?action=comment` | POST | `{ post_id, content }` (max. 500 tekens) | `{ success, comment }` |
| `?action=comments` | GET | `?post_id=<id>` | `{ success, comments: [...] }` |
| `?action=comment_like` | POST | `{ comment_id }` | `{ success, liked, like_count }` |
| `?action=comment_delete` | POST | `{ comment_id }` | `{ success }` — eigen reactie, of reactie onder je eigen post (anders 403) |

## stories.php — stories, 24 uur (`StoryController`)

| Actie | Methode | Body | Antwoord |
|---|---|---|---|
| actieve stories | GET | – | `{ success, stories: Story[] }` (per gebruiker bij elkaar: eigen eerst, dan wie de nieuwste story heeft; binnen een gebruiker oudste eerst) |
| plaatsen | POST | `{ image }` | `{ success, id }` |
| `?action=like` | POST | `{ id }` | `{ success, liked, like_count }` (niet je eigen story) |
| `?action=delete` | POST | `{ id }` | `{ success }` (alleen eigen story) |

`Story = { id, user, avatar, img, created_at, like_count, liked, mine, likers: [namen, alleen bij eigen story] }`

## follows.php — volgen (`FollowController`)

| Methode | Body | Antwoord |
|---|---|---|
| POST | `{ username }` | `{ success, action: "follow" \| "unfollow", followers: [...], following: [...] }` |

Wisselt tussen volgen en ontvolgen. `followers` = volgers van de ander, `following` = wie jij volgt.

## users.php — zoeken en profielen (`UserController`)

| Actie | Methode | Parameters | Antwoord |
|---|---|---|---|
| zoeken | GET | `?q=<tekst>` (leeg = iedereen) | `{ success, users: [{ username, avatar, follower_count, post_count }] }` (max. 30, zonder jezelf) |
| profiel | GET | `?user=<naam>` | `{ success, user: { username, bio, avatar, post_count, followers, following, is_me, i_follow } }` |
| voorstellen | GET | `?suggest=1` | `{ success, users: [{ username, avatar, follower_count, follows_me }] }` (max. 5 die je nog niet volgt) |

## messages.php — berichten, DM's (`MessageController`)

| Actie | Methode | Parameters / body | Antwoord |
|---|---|---|---|
| `?action=conversations` | GET | – | `{ success, me, conversations: [{ username, avatar, last_text, last_mine, created_at, unread }] }` |
| `?action=list` | GET | `&user=<naam>` | `{ success, me, messages: [{ id, sender, recipient, text, mine, created_at, read }] }` — markeert berichten van de ander als gelezen |
| `?action=unread` | GET | – | `{ success, me, unread }` |
| `?action=send` | POST | `{ recipient, text }` (max. 2000 tekens, niet naar jezelf) | `{ success, message_id }` |

`me` is de gebruiker die de server als ingelogd ziet; de frontend schakelt om als dat een ander account is
(bijv. na inloggen op een ander account in een ander tabblad).

## notifications.php — meldingen (`NotificationController`)

| Methode | Antwoord |
|---|---|
| GET | `{ success, notifications: [{ type, actor, avatar, post_id, text, image, i_follow, created_at }] }` (laatste 30) |

`type` is `like`, `comment`, `follow`, `story_like` of `comment_like`. Meldingen hebben geen eigen tabel; ze worden
afgeleid uit de tabellen `likes`, `comments`, `follows`, `story_likes` en `comment_likes`. Welke meldingen al gezien
zijn, onthoudt de browser (localStorage).
