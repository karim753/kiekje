# Kiekje 📸

Een Instagram-achtige webapp in **HTML, CSS, JavaScript, React, PHP en MySQL**.
Geen Python, C# of Laravel: de backend is **objectgeoriënteerde PHP** (klassen, overerving) met PDO, zonder framework.

De app is grotendeels gewone JavaScript; de **zoekpagina is een React-component** (React 18 met htm, zonder build-stap).
Daarnaast staat er een los **Vue**-voorbeeld in `vue/`.

## Functies

- **Account**: registreren, inloggen, uitloggen, naam en bio wijzigen
- **Profielfoto**: uploaden met bijsnijdvenster (zoomen, verplaatsen, draaien), standaardfoto voor iedereen
- **Posts**: foto plaatsen met bijschrift en locatie, bewerken, verwijderen, delen via link
- **Liken**: hartje of dubbelklik op de foto (met animatie)
- **Reacties**: plaatsen, alle reacties bekijken, reacties liken, eigen reacties (of reacties onder je eigen post) verwijderen
- **Stories**: 24 uur zichtbaar, bekijken, liken, reageren via DM
- **Volgen**: volgen/ontvolgen, volgers- en volgend-lijsten, voorgestelde accounts
- **Berichten (DM's)**: inbox, live gesprek, gelezen/verzonden, ongelezen-teller
- **Meldingen**: likes, reacties, nieuwe volgers, story-likes en reactie-likes, gegroepeerd per periode
- **Zoeken** naar gebruikers (React-component, zoekt live mee)
- **Weergave**: licht, donker of automatisch (volgt je apparaat), via Instellingen (tandwiel)
- **Responsive**: onder-/bovenbalk op telefoon, zijbalk + voorstellen op groot scherm

## Starten (XAMPP)

1. Zet de map in `C:\xampp\htdocs\kiekje\kiekje` en start **Apache** en **MySQL** in XAMPP.
2. Maak de database aan (eenmalig), bijvoorbeeld via phpMyAdmin → *Importeren* → `database/schema.sql`, of:
   ```bash
   C:\xampp\mysql\bin\mysql.exe -u root < database/schema.sql
   ```
3. Open **http://localhost/kiekje/kiekje/frontend/index.html** en maak een account aan.

De databaseverbinding staat in `backend/config/database.php` (standaard `root` zonder wachtwoord op `127.0.0.1`,
aan te passen met de omgevingsvariabelen `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASS`).

## Mapstructuur

```
kiekje/
├── frontend/                  De app in de browser
│   ├── index.html             Laadt de stijl en de scripts (in vaste volgorde)
│   ├── css/style.css          Alle opmaak
│   ├── vendor/                React 18, ReactDOM en htm (lokaal, werkt zonder internet)
│   ├── js/                    JavaScript, per onderdeel een bestand:
│   │   ├── state.js           globale toestand (ingelogde gebruiker, tabblad, geladen data)
│   │   ├── api.js             alle verzoeken naar de PHP-API
│   │   ├── utils.js           hulpfuncties (escapen, tijd, profielfoto's, foto's inlezen)
│   │   ├── session.js         inloggen/uitloggen synchroon met de PHP-sessie
│   │   ├── navigation.js      tabbladen wisselen en data laden
│   │   ├── posts.js           liken, reageren, bewerken, verwijderen, plaatsen
│   │   ├── feed.js            weergave van de feed en het reactievenster
│   │   ├── stories.js         stories
│   │   ├── profile.js         profiel, volgen, profielfoto + bijsnijdvenster
│   │   ├── messages.js        DM's en inbox
│   │   ├── notifications.js   meldingen
│   │   ├── search.js          zoekpagina (React-component: SearchPage, UserRow, Avatar)
│   │   ├── auth.js            inlog-/registratiescherm
│   │   ├── icons.js           SVG-iconen
│   │   ├── layout.js          zijbalk, boven-/onderbalk, rechterkolom, render()
│   │   ├── modals.js          vensters (nieuwe post, profiel bewerken, DM, story, ...)
│   │   ├── events.js          knoppen koppelen aan functies
│   │   └── main.js            start de app
│   ├── .prettierrc.json       opmaakregels voor de code (Prettier)
│   └── .htaccess              browser laadt altijd de nieuwste versie
│
├── backend/                   PHP-API (JSON, OOP), zie backend/README.md
│   ├── api/                   ingangen (auth, posts, interactions, stories, follows, users,
│   │                          messages, notifications): elk start één controller
│   ├── bootstrap.php          laadt klassen automatisch (namespace Kiekje)
│   ├── src/Controllers/       één klasse per onderdeel (erven van abstract Controller)
│   ├── src/Repositories/      alle SQL (erven van abstract Repository) + LikeTable
│   ├── src/Core/              Request, Response, Session, Database, ImageStorage, Validator
│   ├── config/database.php    databaseverbinding
│   ├── uploads/               geüploade foto's (.htaccess blokkeert scripts in deze map)
│   ├── tests/                 PHPUnit unit tests (23)
│   └── tools/                 losse beheerscripts
│
├── database/schema.sql        MySQL-schema (9 tabellen)
├── tests/e2e/                 Browsertests (Puppeteer) in een afgeschermde testomgeving
├── docs/
│   ├── documentatie.md        Backlog, scrum, AVG, copyright, ethiek, acceptatietest, versiebeheer
│   ├── api.md                 Alle API-endpoints met parameters en antwoorden
│   └── architectuur.md        Hoe de app werkt: lagen, dataflow, React, beveiliging, tests
├── diagrams/                  ERD, klassendiagram, domeinmodel, use case, activity, sequentie,
│                              architectuur, sitemap, wireframes (SVG) + genereer-diagrammen.js
├── composer.json, phpunit.xml PHPUnit-configuratie (composer install → vendor/)
├── vue/stories-widget.html    Los Vue 3-component (verhalenbalk), niet gebruikt door de app
└── tools/                     Hulpscripts
```

### Hoe de frontend werkt

- De scripts zijn gewone `<script>`-bestanden (geen modules of bundler). Ze delen dezelfde globale
  variabelen, daarom is de **volgorde in `index.html` belangrijk**: `state.js` eerst, `main.js` als laatste.
- `render()` (in `layout.js`) bouwt de pagina op basis van de toestand in `state.js`;
  `events()` (in `events.js`) koppelt daarna de knoppen.
- De zoekpagina is een **React-component** (`js/search.js`): `render()` zet een lege `<div id="react-search">`
  neer en React tekent daar het component in, met eigen state (`useState`) en live zoeken (`useEffect`).
- Meer uitleg: [docs/architectuur.md](docs/architectuur.md). API: [docs/api.md](docs/api.md).
- Alle data komt uit de database via de API. `localStorage` bewaart alleen UI-voorkeuren
  (laatste tabblad, welke meldingen je al gezien hebt).

## Tests

- **Browsertests** (`tests/e2e/`): testen de hele app in Chrome, in een aparte database `kiekje_test`
  en een losse kopie van de app, zodat de echte data nooit geraakt wordt. Zie `tests/e2e/README.md`.
  ```bash
  cd tests/e2e
  npm install
  npm test
  ```
- **Unit tests** (PHPUnit, 23 tests voor de backend-klassen):
  ```bash
  composer install        # eenmalig
  vendor/bin/phpunit      # of: composer test
  ```

## Design

Eigen merk "Kiekje" (geen Instagram-logo of -merk i.v.m. auteursrecht), met een analoge-filmrol-sfeer:
warme amber/roze accenten op een donkere achtergrond en een filmstrook onder de bovenbalk.
Lettertypes: Georgia voor het logo en de koppen, de systeemletter van het apparaat voor de rest.
