# Browsertests

Deze tests openen Kiekje in Chrome (via [Puppeteer](https://pptr.dev/)) en klikken door de app zoals een
echte gebruiker: registreren, posten, liken, reageren, DM's, meldingen, profielfoto's en de lay-out.

## Veilig: nooit op de echte app

Voor elke test wordt een **afgeschermde testomgeving** opgezet (`testomgeving.js`):

- een lege database **`kiekje_test`** met dezelfde tabellen als `kiekje`
- een kopie van de app op **http://localhost/kiekje_testrun/** die die testdatabase gebruikt

Na afloop worden beide weer verwijderd. Testaccounts en testfoto's komen dus nooit in de echte app,
database of `backend/uploads/` terecht.

## Draaien

Nodig: XAMPP (Apache + MySQL aan), Node.js en Google Chrome.

```bash
cd tests/e2e
npm install          # eenmalig
npm test             # alle tests
node alle-tests.js meldingen   # alleen tests waarvan de naam "meldingen" bevat
```

Staat Chrome of XAMPP ergens anders, zet dan `CHROME_PATH`, `HTDOCS` of `MYSQL_BIN` (zie `config.js`).

## Bestanden

| Bestand | Test |
|---|---|
| `volledige-flow.test.js` | twee gebruikers: registreren, post + story, volgen, liken, reageren, DM heen en weer, meldingen, bewerken, naam wijzigen, uitloggen |
| `reacties-openen.test.js` | reactievenster openen via 💬 en "Bekijk alle reacties" |
| `reacties-liken-verwijderen.test.js` | reacties liken en verwijderen, rechten (403 voor buitenstaanders) |
| `meldingen.test.js` | meldingen, groeperen van likes, terugvolgen, lege staat |
| `profielfoto.test.js` | standaardfoto, profielfoto wijzigen en verwijderen |
| `bijsnijden.test.js` | bijsnijdvenster: zoomen, verplaatsen, draaien, annuleren |
| `bugfixes.test.js` | opgeloste bugs blijven opgelost: `@` in naam, uitloggen via link, geen cache, stories per gebruiker, snel dubbelklikken/liken, mislukte story-reactie |
| `layout.test.js` | zijbalk/onderbalk per schermgrootte, voorstellen, dubbelklik-like |
| `zoeken.test.js` | zoekpagina is een React-component: live zoeken, geen resultaten, profiel openen, zoekterm bewaard |
| `alle-tests.js` | draait alle tests, elk met een schone testdatabase |
| `testomgeving.js` | zet de testomgeving op of ruimt hem op |
| `config.js` | paden en instellingen |
| `nav-helper.js` | laat tests menuknoppen aanklikken |

Screenshots en tijdelijke plaatjes komen in `output/`.
