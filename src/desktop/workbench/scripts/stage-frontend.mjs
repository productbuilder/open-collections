import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const WORKBENCH_ROOT = path.resolve(SCRIPT_DIR, '..');
const REPO_ROOT = path.resolve(WORKBENCH_ROOT, '..', '..', '..');
const DIST_ROOT = path.join(WORKBENCH_ROOT, 'dist');
const SOURCE_SEGMENTS = ['apps', 'collections', 'packages', 'shared'];

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function copyPath(sourcePath, destinationPath, options = {}) {
  fs.cpSync(sourcePath, destinationPath, {
    recursive: true,
    force: true,
    ...options,
  });
}

function stageIndexHtml() {
  const workbenchIndexPath = path.join(REPO_ROOT, 'src', 'desktop', 'workbench', 'index.html');
  const distIndexPath = path.join(DIST_ROOT, 'index.html');
  const original = fs.readFileSync(workbenchIndexPath, 'utf8');
  const adjusted = original.replace(
    /<script\s+type="module"\s+src="\.\/src\/main\.js"><\/script>/,
    '<script type="module" src="./src/desktop/workbench/src/main.js"></script>',
  );
  fs.writeFileSync(distIndexPath, adjusted, 'utf8');
}

function stageFrontend() {
  fs.rmSync(DIST_ROOT, { recursive: true, force: true });
  ensureDir(DIST_ROOT);

  const distSrcRoot = path.join(DIST_ROOT, 'src');
  ensureDir(distSrcRoot);
  for (const segment of SOURCE_SEGMENTS) {
    const sourcePath = path.join(REPO_ROOT, 'src', segment);
    const destinationPath = path.join(distSrcRoot, segment);
    copyPath(sourcePath, destinationPath);
  }

  const workbenchSource = path.join(REPO_ROOT, 'src', 'desktop', 'workbench', 'src');
  const workbenchDestination = path.join(distSrcRoot, 'desktop', 'workbench', 'src');
  ensureDir(path.dirname(workbenchDestination));
  copyPath(workbenchSource, workbenchDestination);

  stageIndexHtml();
  process.stdout.write(`Staged desktop frontend at ${DIST_ROOT}\n`);
}

stageFrontend();
