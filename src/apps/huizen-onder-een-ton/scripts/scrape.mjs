#!/usr/bin/env node
import { writeFile, readFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const APP_ROOT = resolve(__dirname, '..');
const DATA_DIR = resolve(APP_ROOT, 'data');
const HOUSES_PATH = resolve(DATA_DIR, 'houses.json');
const SOURCES_PATH = resolve(DATA_DIR, 'sources.json');
const REPORT_PATH = resolve(DATA_DIR, 'scrape-report.md');

const USER_AGENT = 'huizen-onder-een-ton-bot/0.1 (+https://github.com/productbuilder/open-collections)';
const MAX_PRICE_EUR = 100000;
const RATE_LIMIT_MS = 1200;

const SOURCE_RULES = {
  'idealista.it': {
    cardPattern: /<article[\s\S]*?<\/article>/gi,
    titlePattern: /<a[^>]*class="[^"]*item-link[^"]*"[^>]*>(.*?)<\/a>/i,
    urlPattern: /<a[^>]*class="[^"]*item-link[^"]*"[^>]*href="([^"]+)"/i,
    pricePattern: /<span[^>]*class="[^"]*item-price[^"]*"[^>]*>(.*?)<\/span>/i,
    locationPattern: /<span[^>]*class="[^"]*item-detail[^"]*"[^>]*>(.*?)<\/span>/i,
    imagePattern: /<img[^>]*src="([^"]+)"/i,
    country: 'Italië',
    source: 'Idealista'
  },
  'kyero.com': {
    cardPattern: /<article[\s\S]*?<\/article>/gi,
    titlePattern: /<h2[^>]*>(.*?)<\/h2>/i,
    urlPattern: /<a[^>]*href="([^"]+)"/i,
    pricePattern: /€\s?[\d.,]+/i,
    locationPattern: /<p[^>]*class="[^"]*location[^"]*"[^>]*>(.*?)<\/p>/i,
    imagePattern: /<img[^>]*src="([^"]+)"/i,
    country: 'Spanje',
    source: 'Kyero'
  },
  'green-acres.fr': {
    cardPattern: /<article[\s\S]*?<\/article>/gi,
    titlePattern: /<h2[^>]*>(.*?)<\/h2>/i,
    urlPattern: /<a[^>]*href="([^"]+)"/i,
    pricePattern: /€\s?[\d.,]+/i,
    locationPattern: /<span[^>]*class="[^"]*location[^"]*"[^>]*>(.*?)<\/span>/i,
    imagePattern: /<img[^>]*src="([^"]+)"/i,
    country: 'Frankrijk',
    source: 'Green-acres'
  }
};

const sleep = (ms) => new Promise((resolveSleep) => setTimeout(resolveSleep, ms));

function stripTags(value = '') {
  return value
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function parsePriceEur(value) {
  if (!value) return null;
  const digits = value.replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.');
  const numeric = Number.parseFloat(digits);
  return Number.isFinite(numeric) ? Math.round(numeric) : null;
}

function normalizeUrl(url, searchUrl) {
  if (!url) return searchUrl;
  try {
    return new URL(url, searchUrl).toString();
  } catch {
    return searchUrl;
  }
}

async function canScrape(searchUrl) {
  const parsed = new URL(searchUrl);
  const robotsUrl = `${parsed.origin}/robots.txt`;

  try {
    const response = await fetch(robotsUrl, { headers: { 'User-Agent': USER_AGENT } });
    if (!response.ok) {
      return { allowed: false, reason: `robots.txt niet beschikbaar (${response.status})` };
    }

    const robots = await response.text();
    const disallowAll = /User-agent:\s*\*([\s\S]*?)($|User-agent:)/gi;
    let match;
    let blocked = false;

    while ((match = disallowAll.exec(robots)) !== null) {
      const block = match[1];
      if (/Disallow:\s*\//i.test(block)) {
        blocked = true;
        break;
      }
    }

    if (blocked) {
      return { allowed: false, reason: 'robots.txt blokkeert User-agent * voor alle paden' };
    }

    return { allowed: true, reason: 'robots.txt geen globale blokkade gevonden' };
  } catch (error) {
    return { allowed: false, reason: `robots-check mislukt (${error.message})` };
  }
}

function extractListings(html, sourceConfig, searchUrl, domain) {
  const rules = SOURCE_RULES[domain];
  if (!rules) return [];

  const cards = html.match(rules.cardPattern) || [];

  return cards
    .map((card, index) => {
      const title = stripTags(card.match(rules.titlePattern)?.[1]);
      const url = normalizeUrl(card.match(rules.urlPattern)?.[1], searchUrl);
      const priceRaw = stripTags(card.match(rules.pricePattern)?.[0] || '');
      const priceEur = parsePriceEur(priceRaw);
      const location = stripTags(card.match(rules.locationPattern)?.[1]);
      const thumbnail = normalizeUrl(card.match(rules.imagePattern)?.[1], searchUrl);

      if (!title || !priceEur || priceEur > MAX_PRICE_EUR) {
        return null;
      }

      return {
        id: `${domain}-${index}-${priceEur}`,
        title,
        description: `Listing gevonden via ${sourceConfig.name}.`,
        price: priceRaw || `€${priceEur}`,
        priceEur,
        location,
        country: rules.country,
        thumbnail,
        url,
        source: rules.source,
        sourceDomain: domain,
        scrapedAt: new Date().toISOString()
      };
    })
    .filter(Boolean);
}

function dedupe(houses) {
  const byKey = new Map();
  for (const house of houses) {
    const key = `${house.sourceDomain}|${house.url}|${house.priceEur}`;
    if (!byKey.has(key)) {
      byKey.set(key, house);
    }
  }
  return [...byKey.values()];
}

async function main() {
  const sources = JSON.parse(await readFile(SOURCES_PATH, 'utf8'));
  const reportLines = ['# Scrape report', '', `- Datum: ${new Date().toISOString()}`, `- User-Agent: ${USER_AGENT}`, ''];

  const results = [];

  for (const source of sources) {
    const { domain, searchUrl, status, notes } = source;

    if (status === 'skipped') {
      reportLines.push(`- ${source.name}: overgeslagen (${notes})`);
      continue;
    }

    const robots = await canScrape(searchUrl);
    if (!robots.allowed) {
      reportLines.push(`- ${source.name}: overgeslagen (${robots.reason})`);
      continue;
    }

    try {
      await sleep(RATE_LIMIT_MS);
      const response = await fetch(searchUrl, { headers: { 'User-Agent': USER_AGENT } });
      if (!response.ok) {
        reportLines.push(`- ${source.name}: request mislukt (${response.status})`);
        continue;
      }

      const html = await response.text();
      const houses = extractListings(html, source, searchUrl, domain);
      reportLines.push(`- ${source.name}: ${houses.length} woningen gevonden`);
      results.push(...houses);
    } catch (error) {
      reportLines.push(`- ${source.name}: fout (${error.message})`);
    }
  }

  const finalHouses = dedupe(results).sort((a, b) => a.priceEur - b.priceEur);

  await writeFile(HOUSES_PATH, `${JSON.stringify(finalHouses, null, 2)}\n`);
  await writeFile(REPORT_PATH, `${reportLines.join('\n')}\n`);

  console.log(`Klaar. ${finalHouses.length} woningen opgeslagen in ${HOUSES_PATH}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
