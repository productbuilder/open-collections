import fs from 'node:fs';
import path from 'node:path';

const REPO_ROOT = process.cwd();
const OUTPUT_ROOT = path.join(REPO_ROOT, 'docs');
const LOCALES = ['en', 'nl'];
const BINARY_ASSET_EXTENSIONS = new Set(['.exe', '.msi', '.dmg', '.pkg', '.appimage', '.zip']);
const ROOT_ASSET_FILES = [
  'CNAME',
  'src/shared/components/open-collections-registry-widget.js',
  'src/apps/browser/README.md',
  'src/apps/manager/README.md',
  'notes/collection-manifest-spec.md',
  'notes/provider-and-storage-implementation.md',
  'notes/collection-registry-and-indexer.md',
  'notes/linked-collections-architecture.md',
  'notes/wordpress-integration.md',
  'notes/wordpress-plugin-scaffold.md',
];
const ROOT_ASSET_DIRECTORIES = [
  ['src/apps/browser', 'src/apps/browser'],
  ['src/apps/manager', 'src/apps/manager'],
  ['site/examples', 'site/examples'],
];
const EXCLUDED_SITE_SOURCE_PATHS = new Set([
  'site/browser/index.html',
  'site/manager/index.html',
]);

const posix = path.posix;

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function listFiles(dirPath) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...listFiles(fullPath));
      continue;
    }
    files.push(fullPath);
  }
  return files;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function toPosix(filePath) {
  return filePath.split(path.sep).join('/');
}

function sourcePathToRoute(sourcePath) {
  const normalized = toPosix(sourcePath);
  if (normalized === 'index.html') {
    return '';
  }
  if (!normalized.startsWith('site/')) {
    throw new Error(`Unsupported source path: ${sourcePath}`);
  }
  const stripped = normalized.slice('site/'.length);
  return stripped.endsWith('/index.html') ? stripped.slice(0, -'index.html'.length) : stripped;
}

function routeToFilePath(route) {
  if (!route) {
    return 'index.html';
  }
  return route.endsWith('/') ? `${route}index.html` : route;
}

function routeToPageId(route) {
  if (!route) {
    return 'home';
  }

  const normalized = route
    .replace(/index\.html$/, '')
    .replace(/\.html$/, '')
    .replace(/\/$/, '');

  return normalized || 'home';
}

function activeSectionForRoute(route) {
  if (!route) {
    return 'home';
  }

  const [section] = route.replace(/\/$/, '').split('/');
  return section || 'home';
}

function bodyClassFromHtml(html) {
  const match = html.match(/<body[^>]*class="([^"]+)"[^>]*>/i);
  return match?.[1] ?? '';
}

function extractMain(html) {
  const match = html.match(/<main>([\s\S]*?)<\/main>/i);
  if (!match) {
    throw new Error('Could not find <main> block');
  }
  return match[1].trim();
}

function titleFromHtml(html) {
  const match = html.match(/<title>([\s\S]*?)<\/title>/i);
  return match?.[1].trim() ?? 'Open Collections';
}

function extractHeadSupplement(html) {
  const match = html.match(/<head>([\s\S]*?)<\/head>/i);
  if (!match) {
    return '';
  }

  return match[1]
    .replace(/<meta[^>]*charset=[^>]*>\s*/gi, '')
    .replace(/<meta[^>]*name="viewport"[^>]*>\s*/gi, '')
    .replace(/<title>[\s\S]*?<\/title>\s*/gi, '')
    .replace(/<script[^>]*site-shell-components\.js[^>]*><\/script>\s*/gi, '')
    .replace(/<link[^>]*href="(?:\.\.\/)+(?:index\.css)"[^>]*>\s*/gi, '')
    .trim();
}

function extractPostMainSupplement(html) {
  const match = html.match(/<\/main>([\s\S]*?)<\/body>/i);
  if (!match) {
    return '';
  }

  return match[1]
    .replace(/<script[^>]*docs-nav\.js[^>]*><\/script>\s*/gi, '')
    .replace(/<open-collections-site-footer[\s\S]*?<\/open-collections-site-footer>\s*/gi, '')
    .trim();
}

function fileNeedsDocsNav(html, route) {
  return route.startsWith('docs/') || html.includes('data-docs-nav');
}

function fileNeedsRegistryWidget(html) {
  return html.includes('open-collections-registry-widget.js') || html.includes('<open-collections-registry-widget');
}

function sourceTargetExists(targetPath) {
  return fs.existsSync(path.join(REPO_ROOT, targetPath));
}

function mapSourceTargetToOutput(targetPath, locale, originalUrlPath = '') {
  if (targetPath === 'index.html') {
    return `${locale}/index.html`;
  }
  if (targetPath === 'index.css') {
    return `${locale}/index.css`;
  }
  if (targetPath.startsWith('site/')) {
    const remainder = targetPath.slice('site/'.length);
    return `${locale}/${remainder}`;
  }
  if (targetPath.startsWith('src/')) {
    return targetPath;
  }
  if (targetPath === '.' || targetPath === '') {
    return `${locale}/index.html`;
  }
  if (sourceTargetExists(targetPath) && fs.statSync(path.join(REPO_ROOT, targetPath)).isDirectory()) {
    return `${locale}/${targetPath}/index.html`;
  }
  if (!posix.extname(targetPath) && originalUrlPath.endsWith('/')) {
    return `${locale}/${targetPath}/index.html`;
  }
  return targetPath;
}

function toRelativeHref(fromFilePath, toFilePath) {
  const fromDir = posix.dirname(fromFilePath);
  let relative = posix.relative(fromDir, toFilePath);
  if (!relative || relative === '') {
    relative = '.';
  }
  if (!relative.startsWith('.')) {
    relative = `./${relative}`;
  }
  return relative;
}

function rewriteUrl(value, sourcePath, locale, currentOutputFile) {
  if (!value || /^(?:[a-z]+:|mailto:|tel:|#|javascript:)/i.test(value)) {
    return value;
  }

  const match = value.match(/^([^?#]*)(\?[^#]*)?(#.*)?$/);
  const rawPath = match?.[1] ?? value;
  const search = match?.[2] ?? '';
  const hash = match?.[3] ?? '';

  if (rawPath.startsWith('/api/') || rawPath.startsWith('/src/')) {
    return value;
  }

  const sourceDir = sourcePath === 'index.html' ? '' : posix.dirname(toPosix(sourcePath));
  const resolvedSourceTarget = rawPath.startsWith('/')
    ? rawPath.replace(/^\//, '')
    : posix.normalize(posix.join(sourceDir, rawPath || '.'));
  const targetOutput = mapSourceTargetToOutput(resolvedSourceTarget, locale, rawPath);
  const targetForRelative = rawPath.endsWith('/') && targetOutput.endsWith('/index.html')
    ? posix.dirname(targetOutput)
    : targetOutput;
  const relative = toRelativeHref(currentOutputFile, targetForRelative);
  if (rawPath.endsWith('/') && !relative.endsWith('/')) {
    return `${relative}/${search}${hash}`;
  }
  return `${relative}${search}${hash}`;
}

function rewriteHtmlUrls(html, sourcePath, locale, currentOutputFile) {
  return html.replace(/\b(href|src|action)="([^"]+)"/g, (_match, attr, value) => {
    const rewritten = rewriteUrl(value, sourcePath, locale, currentOutputFile);
    return `${attr}="${rewritten}"`;
  });
}

function renderBreadcrumbs(items, homeLabel) {
  const trail = [homeLabel, ...items].join(' / ');
  if (items.length === 0) {
    return `<p class="breadcrumbs">${homeLabel}</p>`;
  }
  const [first, ...rest] = items;
  let content = `<a href="../">${homeLabel}</a>`;
  const allRest = [first, ...rest];
  for (const item of allRest) {
    content += ` / ${escapeHtml(item)}`;
  }
  return `<p class="breadcrumbs">${content}</p>`;
}

function renderUntranslatedNotice(i18n) {
  const notice = i18n.shell.untranslatedNotice;
  return `
    <section class="section-soft" data-i18n-fallback-notice>
      <h2>${escapeHtml(notice.title)}</h2>
      <p>${escapeHtml(notice.body)}</p>
    </section>
  `;
}

function renderHomePage(localeData) {
  const page = localeData.pages.home;
  const introFeatures = [
    '<path d="M12 3 4 8v5c0 4.4 3.2 7.9 8 8 4.8-.1 8-3.6 8-8V8z" />',
    '<path d="M10 13a4 4 0 0 1 0-6l2-2a4 4 0 1 1 5.7 5.6l-1.3 1.4" /><path d="M14 11a4 4 0 0 1 0 6l-2 2a4 4 0 1 1-5.7-5.6l1.3-1.4" />',
    '<path d="M5 8h14M5 12h10M5 16h14" />',
    '<path d="M12 5v14" /><path d="m7 10 5-5 5 5" /><path d="m7 14 5 5 5-5" />'
  ];
  const workflowIcons = [
    '<path d="M4 12h5l2.5-4 3 8 2-4H20" />',
    '<path d="M4 7h16M4 12h16M4 17h10" />',
    '<path d="M4 12a8 8 0 0 1 16 0" /><path d="M12 7v10" /><path d="M8.5 13.5 12 17l3.5-3.5" />'
  ];
  const cards = page.nextSteps.cards.map((card) => `
    <a class="link-card" href="${card.href}">
      <strong>${escapeHtml(card.title)}</strong><br />${escapeHtml(card.body)}
    </a>
  `).join('');

  return `
    <header class="hero">
      <p class="eyebrow">${escapeHtml(page.hero.eyebrow)}</p>
      <h1>${page.hero.headlineHtml}</h1>
      <p class="lead">${page.hero.leadHtml}</p>
      <div class="cta-row" aria-label="${escapeHtml(page.hero.ctaAriaLabel)}">
        <a class="button-link" href="./get-started/">${escapeHtml(page.hero.primaryCta)}</a>
        <a class="button-link button-link-secondary" href="./tools/">${escapeHtml(page.hero.secondaryCta)}</a>
      </div>
    </header>

    <section class="section-intro split-layout">
      <div>
        <h2>${escapeHtml(page.intro.title)}</h2>
        <p>${escapeHtml(page.intro.body)}</p>
      </div>
      <ul class="feature-list icon-list">
        ${page.intro.features.map((feature, index) => `<li><svg class="oc-icon oc-icon-bullet" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${introFeatures[index]}</svg><span>${escapeHtml(feature)}</span></li>`).join('')}
      </ul>
    </section>

    <section>
      <h2>${escapeHtml(page.pathways.title)}</h2>
      ${page.pathways.paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join('')}
    </section>

    <section class="section-soft">
      <h2>${escapeHtml(page.curation.title)}</h2>
      ${page.curation.paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join('')}
    </section>

    <section class="section-soft">
      <h2>${escapeHtml(page.audience.title)}</h2>
      <p>${escapeHtml(page.audience.body)}</p>
    </section>

    <section>
      <h2>${escapeHtml(page.workflow.title)}</h2>
      <p>${escapeHtml(page.workflow.body)}</p>
      <div class="steps-grid">
        ${page.workflow.steps.map((step, index) => `
          <article class="step-card">
            <h3>
              <span class="icon-label"><svg class="oc-icon oc-icon-step" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${workflowIcons[index]}</svg>${escapeHtml(step.title)}</span>
            </h3>
            <p>${escapeHtml(step.body)}</p>
          </article>
        `).join('')}
      </div>
    </section>

    <section class="section-utility section-registry-preview">
      <div class="section-heading-row">
        <h2>${escapeHtml(page.registry.title)}</h2>
        <a href="./registry/">${escapeHtml(page.registry.viewAll)}</a>
      </div>
      <p>${escapeHtml(page.registry.body)}</p>
      <open-collections-registry-widget
        title="${escapeHtml(page.registry.widgetTitle)}"
        intro="${escapeHtml(page.registry.widgetIntro)}"
        recent-url="/api/registry/recent?limit=4"
        recent-limit="4"
        list-only
        api-mode="mock"
      ></open-collections-registry-widget>
    </section>

    <section>
      <h2>${escapeHtml(page.nextSteps.title)}</h2>
      <div class="link-grid">${cards}</div>
    </section>
  `;
}

function renderGetStartedPage(localeData) {
  const page = localeData.pages['get-started'];
  return `
    ${renderBreadcrumbs(page.breadcrumbs, localeData.shell.breadcrumbs.home)}
    <header>
      <h1>${escapeHtml(page.hero.title)}</h1>
      <p>${escapeHtml(page.hero.body)}</p>
    </header>
    ${page.sections.map((section) => `
      <section>
        <h2>${escapeHtml(section.title)}</h2>
        ${(section.list ?? []).length ? `<ul>${section.list.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>` : ''}
        ${(section.paragraphs ?? []).map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join('')}
        ${section.cta ? `<p><a class="button-link" href="${section.cta.href}" target="_blank" rel="noopener">${escapeHtml(section.cta.label)}</a></p>` : ''}
        ${section.links ? `<div class="cta-row">${section.links.map((link) => `<a class="button-link button-link-secondary" href="${link.href}">${escapeHtml(link.label)}</a>`).join('')}</div>` : ''}
      </section>
    `).join('')}
  `;
}

function renderDocsIndexPage(localeData) {
  const page = localeData.pages.docs;
  return `
    ${renderBreadcrumbs(page.breadcrumbs, localeData.shell.breadcrumbs.home)}
    <div class="docs-shell">
      <aside class="docs-sidebar" data-docs-nav></aside>
      <div class="docs-content">
        <header>
          <h1>${escapeHtml(page.hero.title)}</h1>
          <p>${escapeHtml(page.hero.body)}</p>
        </header>
        <section>
          <h2>${escapeHtml(page.suggestedReading.title)}</h2>
          <ol>
            ${page.suggestedReading.items.map((item) => `<li><a href="${item.href}">${escapeHtml(item.label)}</a></li>`).join('')}
          </ol>
        </section>
      </div>
    </div>
  `;
}

const TRANSLATED_PAGE_DEFINITIONS = {
  home: {
    bodyClass: '',
    includeDocsNav: false,
    includeRegistryWidget: true,
    render: renderHomePage,
  },
  'get-started': {
    bodyClass: 'docs-page',
    includeDocsNav: false,
    includeRegistryWidget: false,
    render: renderGetStartedPage,
  },
  docs: {
    bodyClass: 'docs-page',
    includeDocsNav: true,
    includeRegistryWidget: false,
    render: renderDocsIndexPage,
  },
};

function hasLocaleSpecificTranslation(pageId) {
  return Object.hasOwn(TRANSLATED_PAGE_DEFINITIONS, pageId);
}

function getTranslatedPageDefinition(pageId) {
  return TRANSLATED_PAGE_DEFINITIONS[pageId] ?? null;
}

function validateLocaleData(locale, localeData, sourceLocaleData) {
  if (localeData.locale !== locale) {
    throw new Error(`Locale file mismatch: expected ${locale}, got ${localeData.locale}`);
  }

  const languageKeys = Object.keys(localeData.languages ?? {}).sort();
  const expectedLanguageKeys = [...LOCALES].sort();
  if (JSON.stringify(languageKeys) !== JSON.stringify(expectedLanguageKeys)) {
    throw new Error(`Locale ${locale} must define language labels for ${expectedLanguageKeys.join(', ')}`);
  }

  for (const pageId of Object.keys(TRANSLATED_PAGE_DEFINITIONS)) {
    if (!localeData.pages?.[pageId]) {
      throw new Error(`Locale ${locale} is missing pages.${pageId}`);
    }
  }

  const sourceDocsHrefList = JSON.stringify((sourceLocaleData.docsNav?.items ?? []).map((item) => item.href));
  const localeDocsHrefList = JSON.stringify((localeData.docsNav?.items ?? []).map((item) => item.href));
  if (sourceDocsHrefList !== localeDocsHrefList) {
    throw new Error(`Locale ${locale} docsNav items must keep the same href structure as the source locale`);
  }
}

function buildContext(locale, i18n, pageId, route) {
  const routeFile = routeToFilePath(route);
  const currentFile = `${locale}/${routeFile}`;
  const alternates = Object.fromEntries(LOCALES.map((targetLocale) => {
    const targetFile = `${targetLocale}/${routeFile}`;
    return [targetLocale, toRelativeHref(currentFile, targetFile)];
  }));

  return {
    locale,
    alternates,
    page: {
      id: pageId,
      route,
      activeSection: activeSectionForRoute(route),
      isTranslated: hasLocaleSpecificTranslation(pageId),
    },
    i18n: {
      locale: i18n.locale,
      siteName: i18n.siteName,
      languageName: i18n.languageName,
      languages: i18n.languages,
      shell: i18n.shell,
      docsNav: i18n.docsNav,
    },
  };
}

function renderHtmlDocument({ locale, route, title, bodyClass, context, mainContent, includeDocsNav, includeRegistryWidget, untranslated, extraHeadContent = '', extraBodyContent = '' }) {
  const currentFile = `${locale}/${routeToFilePath(route)}`;
  const cssHref = toRelativeHref(currentFile, `${locale}/index.css`);
  const shellScriptHref = toRelativeHref(currentFile, `${locale}/shared/site-shell-components.js`);
  const docsNavHref = includeDocsNav ? toRelativeHref(currentFile, `${locale}/docs/docs-nav.js`) : '';
  const registryWidgetHref = includeRegistryWidget ? toRelativeHref(currentFile, 'src/shared/components/open-collections-registry-widget.js') : '';
  const basePath = route ? toRelativeHref(currentFile, `${locale}/index.html`) : './';
  const normalizedBasePath = basePath.endsWith('index.html') ? basePath.slice(0, -'index.html'.length) : basePath;
  const notice = untranslated ? renderUntranslatedNotice(context.i18n) : '';
  const classAttribute = bodyClass ? ` class="${bodyClass}"` : '';

  return `<!doctype html>
<html lang="${locale}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)}</title>
    <link rel="stylesheet" href="${cssHref}" />
    <script>window.OPEN_COLLECTIONS_SITE = ${JSON.stringify(context)};</script>
    <script type="module" src="${shellScriptHref}"></script>
    ${includeRegistryWidget ? `<script type="module" src="${registryWidgetHref}"></script>` : ''}
    ${extraHeadContent}
  </head>
  <body${classAttribute}>
    <open-collections-site-header base-path="${normalizedBasePath}"></open-collections-site-header>
    <main>
      ${notice}
      ${mainContent}
    </main>
    ${extraBodyContent}
    ${includeDocsNav ? `<script src="${docsNavHref}"></script>` : ''}
    <open-collections-site-footer base-path="${normalizedBasePath}"></open-collections-site-footer>
  </body>
</html>`;
}

function renderFallbackPage({ sourcePath, html, locale, i18n }) {
  const route = sourcePathToRoute(sourcePath);
  const pageId = routeToPageId(route);
  const context = buildContext(locale, i18n, pageId, route);
  const currentFile = `${locale}/${routeToFilePath(route)}`;
  const rewrittenMain = rewriteHtmlUrls(extractMain(html), sourcePath, locale, currentFile);
  const rewrittenTitle = titleFromHtml(html);
  const extraHeadContent = rewriteHtmlUrls(extractHeadSupplement(html), sourcePath, locale, currentFile);
  const extraBodyContent = rewriteHtmlUrls(extractPostMainSupplement(html), sourcePath, locale, currentFile);
  return renderHtmlDocument({
    locale,
    route,
    title: rewrittenTitle,
    bodyClass: bodyClassFromHtml(html),
    context,
    mainContent: rewrittenMain,
    includeDocsNav: fileNeedsDocsNav(html, route),
    includeRegistryWidget: fileNeedsRegistryWidget(html),
    untranslated: locale !== 'en' && !hasLocaleSpecificTranslation(pageId),
    extraHeadContent,
    extraBodyContent,
  });
}

function renderTranslatedPage({ sourcePath, locale, i18n }) {
  const route = sourcePathToRoute(sourcePath);
  const pageId = routeToPageId(route);
  const pageDefinition = getTranslatedPageDefinition(pageId);

  if (!pageDefinition) {
    throw new Error(`Missing translated page definition for ${pageId}`);
  }

  const context = buildContext(locale, i18n, pageId, route);
  return renderHtmlDocument({
    locale,
    route,
    title: i18n.pages[pageId].title,
    bodyClass: pageDefinition.bodyClass,
    context,
    mainContent: pageDefinition.render(i18n),
    includeDocsNav: pageDefinition.includeDocsNav,
    includeRegistryWidget: pageDefinition.includeRegistryWidget,
    untranslated: false,
  });
}

function writeFile(relativePath, content) {
  const destinationPath = path.join(OUTPUT_ROOT, relativePath);
  ensureDir(path.dirname(destinationPath));
  fs.writeFileSync(destinationPath, content, 'utf8');
}

function copyFile(sourceRelativePath, destinationRelativePath) {
  const sourcePath = path.join(REPO_ROOT, sourceRelativePath);
  const destinationPath = path.join(OUTPUT_ROOT, destinationRelativePath);
  ensureDir(path.dirname(destinationPath));
  fs.copyFileSync(sourcePath, destinationPath);
}

function copyDirectory(sourceRelativePath, destinationRelativePath) {
  const sourcePath = path.join(REPO_ROOT, sourceRelativePath);
  const destinationPath = path.join(OUTPUT_ROOT, destinationRelativePath);
  ensureDir(path.dirname(destinationPath));
  fs.cpSync(sourcePath, destinationPath, { recursive: true, force: true });
}

function copySharedAssets() {
  for (const locale of LOCALES) {
    copyFile('index.css', `${locale}/index.css`);
    copyFile('site/shared/site-shell-components.js', `${locale}/shared/site-shell-components.js`);
    copyFile('site/docs/docs-nav.js', `${locale}/docs/docs-nav.js`);
  }

  for (const assetFile of ROOT_ASSET_FILES) {
    copyFile(assetFile, assetFile);
  }

  for (const [sourcePath, destinationPath] of ROOT_ASSET_DIRECTORIES) {
    copyDirectory(sourcePath, destinationPath);
  }
}

function copyNonHtmlSiteAssets() {
  const siteFiles = listFiles(path.join(REPO_ROOT, 'site'));
  for (const fullPath of siteFiles) {
    const relative = toPosix(path.relative(REPO_ROOT, fullPath));
    if (relative.endsWith('.html') || relative.startsWith('site/i18n/')) {
      continue;
    }

    const extension = posix.extname(relative).toLowerCase();
    if (relative.startsWith('site/downloads/') || BINARY_ASSET_EXTENSIONS.has(extension)) {
      continue;
    }

    const stripped = relative.slice('site/'.length);
    for (const locale of LOCALES) {
      copyFile(relative, `${locale}/${stripped}`);
    }
  }
}

function renderRootIndex() {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta http-equiv="refresh" content="0; url=./en/" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Open Collections locales</title>
  </head>
  <body>
    <p>Redirecting to <a href="./en/">English</a>.</p>
    <p><a href="./nl/">Ga naar Nederlands</a></p>
  </body>
</html>`;
}

function validateBuiltInternalLinks() {
  const htmlFiles = listFiles(OUTPUT_ROOT).filter((filePath) => filePath.endsWith('.html'));
  const brokenLinks = [];
  const htmlUrlPattern = /\b(?:href|src|action)="([^"]+)"/g;

  for (const htmlFile of htmlFiles) {
    const html = fs.readFileSync(htmlFile, 'utf8');
    for (const match of html.matchAll(htmlUrlPattern)) {
      const value = match[1];
      if (!value || /^(?:[a-z]+:|mailto:|tel:|javascript:|#)/i.test(value) || value.startsWith('/api/')) {
        continue;
      }

      const resolvedPath = value.split('#')[0].split('?')[0];
      if (!resolvedPath) {
        continue;
      }

      const absoluteTarget = path.resolve(path.dirname(htmlFile), resolvedPath);
      const candidatePaths = [absoluteTarget, path.join(absoluteTarget, 'index.html')];
      const exists = candidatePaths.some((candidatePath) => fs.existsSync(candidatePath));
      if (!exists) {
        brokenLinks.push({
          htmlFile: toPosix(path.relative(REPO_ROOT, htmlFile)),
          target: value,
        });
      }
    }
  }

  if (brokenLinks.length > 0) {
    const details = brokenLinks
      .map(({ htmlFile, target }) => `- ${htmlFile} -> ${target}`)
      .join('\n');
    throw new Error(`Built site contains broken internal links:\n${details}`);
  }
}

function build() {
  fs.rmSync(OUTPUT_ROOT, { recursive: true, force: true });
  ensureDir(OUTPUT_ROOT);

  const translationsByLocale = Object.fromEntries(LOCALES.map((locale) => [locale, readJson(path.join(REPO_ROOT, 'i18n', `${locale}.json`))]));
  const sourceLocaleData = translationsByLocale.en;
  for (const locale of LOCALES) {
    validateLocaleData(locale, translationsByLocale[locale], sourceLocaleData);
  }

  const sourceHtmlFiles = ['index.html', ...listFiles(path.join(REPO_ROOT, 'site'))
    .map((filePath) => toPosix(path.relative(REPO_ROOT, filePath)))
    .filter((relative) => relative.endsWith('.html'))
    .filter((relative) => !EXCLUDED_SITE_SOURCE_PATHS.has(relative))];

  copySharedAssets();
  copyNonHtmlSiteAssets();

  for (const locale of LOCALES) {
    const i18n = translationsByLocale[locale];
    for (const sourcePath of sourceHtmlFiles) {
      const html = fs.readFileSync(path.join(REPO_ROOT, sourcePath), 'utf8');
      const route = sourcePathToRoute(sourcePath);
      const pageId = routeToPageId(route);
      const outputPath = `${locale}/${routeToFilePath(route)}`;
      const rendered = hasLocaleSpecificTranslation(pageId)
        ? renderTranslatedPage({ sourcePath, locale, i18n })
        : renderFallbackPage({ sourcePath, html, locale, i18n });
      writeFile(outputPath, rendered);
    }
  }

  writeFile('index.html', renderRootIndex());
  validateBuiltInternalLinks();
  process.stdout.write(`Built localized site output at ${OUTPUT_ROOT}\n`);
}

build();
