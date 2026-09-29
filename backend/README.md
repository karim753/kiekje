# Kiekje backend

PHP-API die JSON teruggeeft, **objectgeoriënteerd** opgezet (zonder framework).
Alle endpoints en hun parameters staan in [docs/api.md](../docs/api.md); het klassendiagram in
[diagrams/klassendiagram.svg](../diagrams/klassendiagram.svg).

## Structuur
```
backend/
  api/                      ingangen: elk bestand start alleen zijn controller, bijv.
                            (new Kiekje\Controllers\PostController())->run();
  bootstrap.php             laadt klassen automatisch (namespace Kiekje\ -> src/)
  src/
    Core/                   basisklassen
      Request.php           verzoek lezen (methode, ?action, JSON-body)
      Response.php          JSON-antwoorden
      Session.php           ingelogde gebruiker, inloggen/uitloggen (nieuw sessie-id)
      Database.php          één gedeelde PDO-verbinding (singleton)
      ImageStorage.php      foto's controleren, opslaan en verwijderen
      Validator.php         invoercontrole (gebruikersnaam, e-mail, lengtes)
      HttpException.php     fout met HTTP-statuscode (404, 422, ...)
    Controllers/            één klasse per endpoint, erven van de abstracte Controller
      Controller.php        run(), currentUser(), dispatch(), ok() — foutafhandeling op één plek
      AuthController.php    registreren, inloggen, uitloggen, profiel, profielfoto
      PostController.php    feed, posts plaatsen/bewerken/verwijderen
      InteractionController.php  likes en reacties
      StoryController.php   stories
      FollowController.php  volgen/ontvolgen
      UserController.php    zoeken, profielen, voorstellen
      MessageController.php DM's
      NotificationController.php meldingen
    Repositories/           alle SQL, erven van de abstracte Repository
      Repository.php        run(), one(), all(), value() — prepared statements
      UserRepository.php, PostRepository.php, CommentRepository.php, StoryRepository.php,
      FollowRepository.php, MessageRepository.php, NotificationRepository.php
      LikeTable.php         herbruikbare like-logica voor posts, reacties en stories
  config/database.php       databaseverbinding (leest DB_HOST, DB_NAME, DB_USER, DB_PASS via getenv())
  uploads/                  geüploade foto's (.htaccess blokkeert scripts)
  tests/                    PHPUnit unit tests
  tools/                    losse beheerscripts (bv. delete_user.php <naam>)
database/schema.sql         MySQL-schema (9 tabellen, zie diagrams/erd.svg)
```

## Opbouw (OOP)

Een verzoek gaat zo door de code:

1. `api/posts.php` laadt `bootstrap.php` en roept `(new PostController())->run()` aan.
2. `Controller::run()` (abstracte basisklasse) roept `handle()` van de subklasse aan en vangt elke fout op:
   een `HttpException` wordt een net JSON-antwoord met de juiste statuscode; andere fouten worden
   "Serverfout." (details alleen in het PHP-foutlog, nooit naar de browser).
3. De controller controleert de gebruiker (`currentUser()`), de invoer (`Validator`) en het eigenaarschap,
   en kiest met `dispatch()` de methode bij `?action=...`.
4. Voor de database gebruikt hij een **repository** (bijv. `PostRepository`); alle SQL staat daar.

OOP-principes in deze code:

| Principe | Waar |
|---|---|
| **Klassen en objecten** | elke controller, repository en Core-klasse |
| **Overerving** | 8 controllers erven van `Controller`, 8 repositories van `Repository` |
| **Abstractie** | `Controller` en `Repository` zijn `abstract`; `handle()` is een abstracte methode |
| **Encapsulatie** | `private`/`protected` velden, bijv. de databaseverbinding (`protected PDO $pdo`) en de sessie |
| **Polymorfisme** | `run()` roept per controller een andere `handle()` aan |
| **Hergebruik (compositie)** | `LikeTable` wordt gebruikt voor likes op posts, reacties én stories |
| **Dependency injection** | `Request` en `Session` kunnen aan een controller worden meegegeven (gebruikt in de unit tests) |

## Draaien

Aanbevolen: **XAMPP** (Apache + MySQL), zie de README in de hoofdmap. Apache gebruikt dan ook de
`.htaccess`-bestanden (geen scripts in `uploads/`, geen verouderde bestanden in de browsercache).

Zonder XAMPP kan het ook met de ingebouwde PHP-server, gestart vanuit de **hoofdmap** van het project
(de frontend roept `../backend/api/` aan, dus beide mappen moeten via dezelfde server bereikbaar zijn):
```bash
mysql -u root -p < database/schema.sql
php -S localhost:8000
# open http://localhost:8000/frontend/index.html
```
Let op: de ingebouwde server negeert `.htaccess`, gebruik dit alleen lokaal.

## Unit tests

```bash
composer install          # eenmalig, installeert PHPUnit
vendor/bin/phpunit        # of: composer test
```
23 tests in `backend/tests/`: wachtwoord-hashing, `Validator`, `ImageStorage` (echte foto's, vermomde scripts,
paden buiten `uploads/`), `Controller` (acties kiezen, foutafhandeling, inloggen verplicht) en `LikeTable`.

## Beveiliging
- **Hash & Salt**: `password_hash()` (bcrypt, cost 12), controle met `password_verify()`; nooit platte wachtwoorden.
- **SQL-injecties voorkomen**: alle queries via `Repository::run()` met prepared statements en placeholders,
  `PDO::ATTR_EMULATE_PREPARES => false`. Tabelnamen komen nooit uit invoer (zie `LikeTable`).
- **Sessies**: `httponly`-cookie met `SameSite=Lax`; bij inloggen/registreren een nieuw sessie-id
  (`Session::login()` → `session_regenerate_id`) tegen session fixation.
- **Eigenaarschap**: bewerken/verwijderen van posts, stories en reacties controleert de server (403), nooit alleen de browser.
- **Uploads**: `ImageStorage` controleert de inhoud met `getimagesizefromstring()` en slaat op onder een
  willekeurige naam; `uploads/.htaccess` voorkomt dat er ooit een script uit die map wordt uitgevoerd.
- **Invoercontrole**: `Validator` (gebruikersnaam 3–30 tekens, bio 160, reactie 500, bericht 2000, bijschrift 2200).
- **CSRF**: sessiecookie met `SameSite=Lax` (niet meegestuurd bij POST-verzoeken van andere sites) en alle
  account-acties alleen via POST, zodat een link je niet kan uitloggen.
- **Eenduidig inloggen**: gebruikersnamen mogen geen `@` bevatten; bij inloggen wint het e-mailadres.
- **Geen cache van privégegevens**: `Response` stuurt `Cache-Control: no-store`.
- **Geen interne details naar buiten**: onverwachte fouten geven alleen "Serverfout."; de details gaan naar het PHP-log.
- **XSS**: de frontend escapet alle tekst van gebruikers (`esc()` in `frontend/js/utils.js`; React doet dit zelf).
- **Scheiding test/live**: browsertests draaien op database `kiekje_test` en een losse kopie van de app
  (`tests/e2e/testomgeving.js`), die via `SetEnv DB_NAME kiekje_test` de testdatabase kiest.
