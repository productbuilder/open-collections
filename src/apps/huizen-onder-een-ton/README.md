# Huizen onder een ton

Statische one-page app die woningen onder €100.000 in Europa toont.

## Structuur

```text
src/apps/huizen-onder-een-ton/
  index.html
  styles.css
  app.js
  data/
    houses.json
    sources.json
    scrape-report.md
  scripts/
    scrape.mjs
```

## Hoe het werkt

- De front-end (`index.html`, `styles.css`, `app.js`) laadt `data/houses.json` en rendert kaarten.
- Zoekveld filtert op titel, beschrijving, locatie en land.
- `scripts/scrape.mjs` is een eenvoudig Node.js-script dat:
  1. `sources.json` leest
  2. per bron `robots.txt` controleert
  3. alleen doorgaat bij toegestane scraping
  4. listings normaliseert en dedupliceert
  5. data wegschrijft naar `houses.json`

## Verantwoord scrapen

- Alleen publieke pagina's.
- Eerst robots.txt checken.
- Rate limiting (standaard 1200ms per request).
- Bronnen met beperkingen of onduidelijke voorwaarden worden overgeslagen.
- Resultaten en overgeslagen bronnen worden gelogd in `data/scrape-report.md`.

## Runnen

```bash
node src/apps/huizen-onder-een-ton/scripts/scrape.mjs
```

Daarna kun je de repo statisch serveren en naar deze app navigeren:

```text
/src/apps/huizen-onder-een-ton/
```

## Opmerking over de huidige dataset

In deze omgeving was uitgaande webtoegang geblokkeerd (HTTP 403), waardoor live scraping niet uitgevoerd kon worden. Daarom bevat `houses.json` nu een startdataset voor UI-validatie. Vervang die door een nieuwe scrape-run in een omgeving met internettoegang.
