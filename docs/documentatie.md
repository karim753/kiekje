# Kiekje — projectdocumentatie

## 1. Backlog & MoSCoW

| # | Userstory | MoSCoW | Storypoints | Status |
|---|-----------|--------|-------------|--------|
| 1 | Als gebruiker wil ik een account aanmaken zodat ik kan inloggen. | Must | 3 | Gerealiseerd |
| 2 | Als gebruiker wil ik inloggen zodat mijn sessie herkend wordt. | Must | 2 | Gerealiseerd |
| 3 | Als gebruiker wil ik een foto met bijschrift plaatsen. | Must | 5 | Gerealiseerd |
| 4 | Als gebruiker wil ik andermans kiekjes kunnen liken. | Must | 2 | Gerealiseerd (ook dubbelklik) |
| 5 | Als gebruiker wil ik kunnen reageren op een kiekje. | Should | 3 | Gerealiseerd (incl. reacties liken/verwijderen) |
| 6 | Als gebruiker wil ik verhalen (stories) kunnen bekijken/plaatsen. | Should | 5 | Gerealiseerd (24 uur, liken, reageren via DM) |
| 7 | Als gebruiker wil ik andere gebruikers kunnen volgen. | Should | 3 | Gerealiseerd (incl. voorstellen) |
| 8 | Als gebruiker wil ik mijn profielgrid kunnen bekijken. | Must | 2 | Gerealiseerd |
| 9 | Als gebruiker wil ik meldingen ontvangen bij een like. | Could | 3 | Gerealiseerd als meldingen in de app (geen pushmeldingen) |
| 10 | Als gebruiker wil ik berichten kunnen sturen (DM). | Could | 8 | Gerealiseerd (inbox, gelezen/verzonden) |
| 11 | Als gebruiker wil ik een profielfoto instellen en bijsnijden. | Should | 3 | Gerealiseerd |
| 12 | Als gebruiker wil ik mijn naam en bio kunnen wijzigen. | Should | 2 | Gerealiseerd |
| 13 | Als gebruiker wil ik andere gebruikers kunnen zoeken. | Should | 2 | Gerealiseerd |

Storypoints zijn geschat met Planning Poker (Fibonacci-reeks) in het team.
Userstory 10 (DM) was eerst *Won't (deze sprint)* en is in een latere sprint opgepakt; 11–13 zijn
tijdens het project toegevoegd.

## 2. Werken in sprints & scrum-board

- Sprintduur: 2 weken.
- Scrum-board (kolommen): *Backlog → To do → In progress → Review → Done*.
- Elke sprint start met sprintplanning (backlog-items uit Must/Should) en eindigt
  met een **retrospective**.

### Retrospective-template (elke sprint)
- Wat ging goed?
- Wat kan beter?
- Concrete actiepunten voor volgende sprint.

## 3. Gesprektechnieken & voortgangsgesprek met teamlead

- **Op tijd aan de bel trekken**: blokkades direct melden in de dagstart of
  direct aan de teamlead, niet pas aan het einde van de sprint.
- Bij het gesprek met de teamlead: STARR-methode gebruiken (Situatie, Taak,
  Actie, Resultaat, Reflectie) om voortgang en obstakels toe te lichten.
- **Reflecteren**: na elke sprint kort reflecteren op eigen aandeel, wat je
  hebt geleerd (technisch en samenwerking) en wat je anders zou doen.

## 4. Versiebeheer

- Git-flow: `main` (stabiel/live), `develop` (integratie), `feature/<naam>`
  per taak. Pull requests + code review vóór mergen naar `develop`.
- Commit-conventie: `feat:`, `fix:`, `docs:`, `test:` prefixes.
- **Scheiding test- en live-omgeving**: de browsertests (`tests/e2e/`) draaien nooit
  op de echte app. Voor elke test wordt een lege database `kiekje_test` en een losse
  kopie van de app (`/kiekje_testrun/`) opgezet; de kopie kiest via `SetEnv DB_NAME`
  de testdatabase (`config/database.php` leest `DB_NAME` met `getenv()`). Na afloop
  wordt alles weer verwijderd, zodat testaccounts en testfoto's nooit in de echte
  database (`kiekje`) of `backend/uploads/` terechtkomen.

## 5. Acceptatietest (voorbeeld)

**Testgeval: kiekje plaatsen**

| Stap | Actie | Verwacht resultaat |
|------|-------|---------------------|
| 1 | Log in met geldig account | Feed wordt getoond |
| 2 | Klik op "Maken" (＋) | Upload-scherm verschijnt |
| 3 | Kies een geldige afbeelding en typ bijschrift | Voorbeeld wordt getoond |
| 4 | Klik "Plaatsen" | Kiekje verschijnt bovenaan eigen profielgrid en feed |
| 5 | Probeer te plaatsen zonder afbeelding | Foutmelding "Afbeelding is verplicht" |

Acceptatiecriteria zijn gebaseerd op de userstory uit de backlog en worden
afgetekend door de productowner/teamlead vóór een sprint als "done" geldt.

Deze en andere scenario's (liken, reageren, DM's, meldingen, profielfoto's, lay-out)
zijn ook geautomatiseerd als browsertests in `tests/e2e/` (zie de README daar).

## 6. AVG (privacy)

- Opgeslagen persoonsgegevens: gebruikersnaam, e-mailadres, een wachtwoord-**hash**
  (nooit het wachtwoord zelf), en wat de gebruiker zelf plaatst: bio, profielfoto,
  posts, stories, reacties, likes, volgrelaties en berichten (DM's).
- Stories worden na 24 uur niet meer getoond (dataminimalisatie in de weergave).
- Gebruikers kunnen hun eigen posts, stories, reacties en profielfoto zelf verwijderen;
  bij posts, stories en profielfoto's wordt ook het fotobestand gewist.
- Recht op vergetelheid: een account verwijderen verwijdert via `ON DELETE CASCADE` ook
  alle posts, stories, likes, reacties, volgrelaties en berichten. Dit kan nu alleen via
  beheer (`backend/tools/delete_user.php <naam>`); **verbeterpunt**: een knop "Account
  verwijderen" in de app, die ook de fotobestanden in `uploads/` opruimt.
- Geen gegevens worden gedeeld met derden zonder toestemming.
- Bij een echte livegang: een privacyverklaring publiceren en een
  verwerkersovereenkomst afsluiten met de hostingpartij.

## 7. Copyright

- Gebruikte lettertypen: Georgia (logo/koppen) en de systeemletter van het
  apparaat; er worden geen lettertypebestanden meegeleverd.
- Iconen zijn eigen, eenvoudige SVG-lijntekeningen in de code (`frontend/js/icons.js`).
- Voorbeeldfoto's van de demo-accounts komen van Unsplash (via picsum.photos, vrij
  te gebruiken); bij een live product uploaden gebruikers uitsluitend eigen content.
- Gebruikers blijven eigenaar van hun eigen geüploade foto's; in de
  gebruiksvoorwaarden wordt vastgelegd dat Kiekje enkel een gebruiksrecht
  krijgt om de foto te tonen binnen het platform.
- De merknaam en het uiterlijk zijn bewust anders dan bestaande social-media
  merken om geen inbreuk te maken op bestaand beeldmerk/auteursrecht.

## 8. Ethiek

- **Contentmoderatie**: bij een echte lancering is een meldknop en
  moderatiebeleid nodig tegen ongepaste content en pesten.
- **Verslavend ontwerp beperken**: geen oneindig scrollende feed (max. 60 posts) en
  geen algoritme dat bepaalt wat je ziet (gewoon nieuwste eerst). Likes worden als
  gewoon getal getoond. Wel verversen badges en open gesprekken automatisch; bij een
  echte lancering hoort daar een instelling bij om meldingen uit te zetten.
- **Transparantie**: gebruikers weten welke gegevens worden opgeslagen (zie
  AVG-sectie) en waarom.
- **Toegankelijkheid** (accessibility): lichte tekst op donkere achtergrond (voldoende
  contrast), `alt`-teksten bij foto's, `aria-label` op knoppen met alleen een icoon,
  `lang="nl"`, en toetsenbordbediening (Enter om te versturen, Esc sluit vensters,
  pijltjes in stories, zoekresultaten met Tab/Enter).

## 9. Netwerk & bestandssystemen

- De backend communiceert via HTTP(S) REST-endpoints (`backend/api/*.php`) tussen
  frontend (JavaScript, zoekpagina in React) en server (PHP), met JSON als uitwisselformaat. De sessie
  loopt via een `httponly`-cookie.
- Geüploade foto's (posts, stories, profielfoto's) worden als bestand opgeslagen in
  `backend/uploads/` onder een willekeurige naam; in de database staat alleen het pad
  (`posts.image_url`, `stories.image_url`, `users.avatar_url`). De server controleert
  of het echt een afbeelding is, en `uploads/.htaccess` voorkomt dat er ooit een
  script uit die map wordt uitgevoerd. Bij een echte livegang zouden de foto's buiten
  de webroot of in objectopslag (bv. een S3-achtige dienst) komen.

## 10. Documentatie en diagrammen

| Document | Inhoud |
|---|---|
| [README.md](../README.md) | functies, starten, mapstructuur, tests |
| [architectuur.md](architectuur.md) | hoe de app werkt: lagen, render-cyclus, React, sessie, beveiliging, testen |
| [api.md](api.md) | alle API-endpoints met parameters, antwoorden en foutcodes |
| [backend/README.md](../backend/README.md) | OOP-opbouw, unit tests en beveiliging van de backend |
| [tests/e2e/README.md](../tests/e2e/README.md) | browsertests en de afgeschermde testomgeving |
| [diagrams/](../diagrams/README.md) | ERD, klassendiagram (echte PHP-klassen), domeinmodel, use case, activity, sequentie (DM), architectuur, sitemap, wireframes |

## 11. Overzicht rubriek-onderdelen en waar ze te vinden zijn

| Onderdeel | Waar |
|---|---|
| HTML, CSS, JavaScript | `frontend/index.html`, `frontend/css/style.css`, `frontend/js/` |
| React | zoekpagina: `frontend/js/search.js` (componenten, `useState`, `useEffect`) |
| Vue | los component `vue/stories-widget.html` (niet gekoppeld aan de app) |
| PHP, MySQL | `backend/src/` (klassen), `backend/api/` (ingangen), `database/schema.sql` |
| OOP | backend: abstracte `Controller` en `Repository` met subklassen, encapsulatie, `LikeTable` (hergebruik), dependency injection — zie [backend/README.md](../backend/README.md) en `diagrams/klassendiagram.svg` |
| Hash & salt | `backend/api/auth.php` (`password_hash`/`password_verify`), unit test `backend/tests/AuthTest.php` |
| Voorkomen SQL-injecties | PDO prepared statements via `Repository::run()` (`backend/src/Repositories/`) |
| Codestructuur, projectstructuur | frontend: één bestand per onderdeel in `frontend/js/`; backend: lagen Controllers / Repositories / Core in `backend/src/`, zie README |
| Gebruikte libraries | React 18, ReactDOM, htm (`frontend/vendor/`), PHPUnit (Composer), Puppeteer (browsertests), Prettier (opmaak) |
| Unit test / acceptatietest | 23 PHPUnit-tests in `backend/tests/` (`vendor/bin/phpunit`); acceptatietest §5 + 9 browsertests in `tests/e2e/` |
| Scheiding test/live | `tests/e2e/testomgeving.js` (database `kiekje_test`), zie §4 |
| ERD, klassendiagram, use case, activity, sitemap, wireframe | `diagrams/` (+ domeinmodel, sequentie- en architectuurdiagram) |
| SEO-vriendelijke opbouw | `lang="nl"`, `<title>` en `<meta name="description">`, semantische elementen (`nav`, `main`, `article`, `header`, `aside`) |
| Accessibility | §8 |
| AVG, copyright, ethiek | §6, §7, §8 |
| Netwerk, bestandssystemen | §9, [architectuur.md](architectuur.md) |
| Backlog, userstories, MoSCoW, storypoints | §1 |
| Sprints, scrum-board, retrospective | §2 |
| Gesprektechnieken, teamlead, reflecteren | §3 |
| Versiebeheer | §4 |
| Gerealiseerde functionaliteit | §1 (kolom Status), README |

De backend is objectgeoriënteerd; de frontend is opgebouwd uit functies per onderdeel (plus React-componenten voor
de zoekpagina). Presentatietechnieken en "werkt op tijd" zijn procesonderdelen en niet in de code terug te zien.

*Niet meegenomen op uitdrukkelijk verzoek: Python, C# en Laravel (puur PHP i.p.v. framework).*
