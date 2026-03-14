# Scrape report

## Laatste run

- Datum: 2026-03-13
- Omgeving: CI/container zonder externe webtoegang (HTTP 403 op uitgaande requests)
- Resultaat: `houses.json` bevat startdataset voor UI-validatie; live scraping kon in deze omgeving niet worden uitgevoerd.

## Beleid

1. Alleen publieke pagina's.
2. Eerst `robots.txt` controleren.
3. Daarna Terms of Service beoordelen.
4. Bij blokkade, onzekerheid of expliciet verbod: bron overslaan en loggen in dit rapport.

## Bronnenstatus

Zie `sources.json` voor actuele status per bron.
