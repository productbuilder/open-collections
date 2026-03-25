#!/usr/bin/env node
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const APP_ROOT = 'src/apps/collection-manager';
const TARGET_GLOBS = [
  `${APP_ROOT}/src/css/**/*.js`,
  `${APP_ROOT}/src/components/**/*.js`
];
const EXCLUDED_PATHS = new Set([
  `${APP_ROOT}/src/css/tokens.css.js`,
  `${APP_ROOT}/src/css/theme.css.js`,
  `${APP_ROOT}/src/css/primitives.css.js`
]);

const HEX_PATTERN = /#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/g;
const RAW_RADIUS_PATTERN = /\bborder-radius\s*:\s*(4px|6px|8px|10px|12px|999px)\b/;

const ALLOWED_LOCAL_HEX = new Set([
  '#0f172a', '#111827', '#dbeafe',
  '#166534', '#86efac', '#f0fdf4',
  '#9a3412', '#fdba74', '#fed7aa', '#fff7ed',
  '#dc2626', '#b91c1c',
  '#1d4ed8', '#0f6cc6', '#0f4f8a', '#66a6e8', '#60a5fa', '#93c5fd', '#94a3b8',
  '#f8fbff', '#f5faff', '#eef6ff', '#eff6ff', '#eef2f7'
]);

const VIOLATION_HINT = 'Use --oc-* token or primitive instead of a raw theme value.';

function run(cmd) {
  try {
    return execSync(cmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (error) {
    if (error?.stdout) {
      return String(error.stdout);
    }
    return '';
  }
}

function resolveBaseRef() {
  const candidates = ['origin/main', 'origin/master', 'main', 'master'];
  for (const ref of candidates) {
    const ok = run(`git rev-parse --verify --quiet ${ref}`);
    if (ok.trim()) {
      const mergeBase = run(`git merge-base HEAD ${ref}`).trim();
      if (mergeBase) {
        return mergeBase;
      }
    }
  }
  return 'HEAD';
}

function collectDiff(baseRef) {
  const pathspec = TARGET_GLOBS.map((glob) => `'${glob}'`).join(' ');
  const diffRange = baseRef === 'HEAD' ? 'HEAD' : `${baseRef}...HEAD`;

  const committed = run(`git diff --no-color --unified=0 ${diffRange} -- ${pathspec}`);
  const workingTree = run(`git diff --no-color --unified=0 HEAD -- ${pathspec}`);

  return `${committed}\n${workingTree}`;
}

function parseDiff(diffText) {
  const violations = [];
  let currentFile = null;
  let newLine = 0;

  for (const rawLine of diffText.split('\n')) {
    const line = rawLine || '';

    if (line.startsWith('+++ b/')) {
      currentFile = line.slice(6).trim();
      continue;
    }

    if (line.startsWith('@@')) {
      const match = line.match(/\+([0-9]+)(?:,([0-9]+))?/);
      if (match) {
        newLine = Number(match[1]);
      }
      continue;
    }

    if (!currentFile || EXCLUDED_PATHS.has(currentFile)) {
      continue;
    }

    if (line.startsWith('+') && !line.startsWith('+++')) {
      const content = line.slice(1);
      inspectLine(currentFile, newLine, content, violations);
      newLine += 1;
      continue;
    }

    if (line.startsWith(' ') || (!line.startsWith('-') && line !== '')) {
      newLine += 1;
    }
  }

  return violations;
}

function collectTargetFiles() {
  const pathspec = TARGET_GLOBS.map((glob) => `'${glob}'`).join(' ');
  const trackedFiles = run(`git ls-files -- ${pathspec}`)
    .split('\n')
    .map((file) => file.trim())
    .filter(Boolean)
    .filter((file) => !EXCLUDED_PATHS.has(file));

  return trackedFiles;
}

function scanAllFiles() {
  const violations = [];
  const files = collectTargetFiles();

  for (const file of files) {
    const lines = readFileSync(file, 'utf8').split('\n');
    lines.forEach((line, index) => inspectLine(file, index + 1, line, violations));
  }

  return violations;
}

function inspectLine(file, lineNumber, content, violations) {
  if (!content.trim() || content.trim().startsWith('//') || content.trim().startsWith('/*')) {
    return;
  }

  if (content.includes('--oc-')) {
    return;
  }

  const hexMatches = [...content.matchAll(HEX_PATTERN)].map((match) => match[0].toLowerCase());
  for (const hex of hexMatches) {
    if (ALLOWED_LOCAL_HEX.has(hex)) {
      continue;
    }

    violations.push({
      file,
      lineNumber,
      value: hex,
      reason: VIOLATION_HINT
    });
  }

  const radiusMatch = content.match(RAW_RADIUS_PATTERN);
  if (radiusMatch) {
    violations.push({
      file,
      lineNumber,
      value: radiusMatch[1],
      reason: VIOLATION_HINT
    });
  }
}

function main() {
  const scanAll = process.argv.includes('--all');
  const violations = scanAll
    ? scanAllFiles()
    : parseDiff(collectDiff(resolveBaseRef()));

  if (!violations.length) {
    if (scanAll) {
      console.log('✅ Collection Manager CSS token guardrail: no raw theme values detected in full scan.');
    } else {
      console.log('✅ Collection Manager CSS token guardrail: no new raw theme values detected.');
    }
    process.exit(0);
  }

  if (scanAll) {
    console.error('❌ Collection Manager CSS token guardrail found potential violations (full scan):');
  } else {
    console.error('❌ Collection Manager CSS token guardrail found potential violations:');
  }
  for (const violation of violations) {
    console.error(`- ${violation.file}:${violation.lineNumber} -> ${violation.value} (${violation.reason})`);
  }
  process.exit(1);
}

main();
