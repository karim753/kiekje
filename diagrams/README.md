# Diagrammen

Alle diagrammen zijn SVG-bestanden (open ze in de browser of VS Code). Ze worden gemaakt door
`genereer-diagrammen.js`; pas daar de gegevens aan als de app verandert en draai:

```bash
node diagrams/genereer-diagrammen.js
```

| Bestand | Wat het laat zien |
|---|---|
| `erd.svg` | Database: alle 9 tabellen, velden, sleutels en relaties |
| `klassendiagram.svg` | De echte PHP-klassen in `backend/src/`: abstracte `Controller` en `Repository` met hun subklassen, Core-klassen, overerving en gebruik |
| `domeinmodel.svg` | Conceptueel model: User, Post, Comment, Story, Message en afgeleide Melding, met attributen, handelingen en relaties |
| `usecase-diagram.svg` | Wat een bezoeker en een ingelogde gebruiker kunnen doen, gegroepeerd per onderdeel |
| `activity-diagram.svg` | Een kiekje plaatsen, van klik tot post in de feed, met swimlanes (gebruiker, browser, server, opslag) en foutpaden |
| `sequentiediagram-dm.svg` | Wat er tussen browser, API en database gebeurt als je een DM stuurt (incl. "Gezien") |
| `architectuur.svg` | Hoe frontend, API, database, bestandsopslag en testomgeving samenwerken |
| `sitemap.svg` | Schermen en vensters van de app (single-page app) |
| `wireframe.svg` | Opbouw van het feed-scherm op telefoon en op groot scherm |
