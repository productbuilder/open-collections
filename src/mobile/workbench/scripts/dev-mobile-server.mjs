import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const desktopServerScript = path.resolve(SCRIPT_DIR, '..', '..', '..', 'desktop', 'workbench', 'scripts', 'dev-static-server.mjs');

const child = spawn(process.execPath, [desktopServerScript, '--root', './dist', '--port', '4173'], {
  stdio: 'inherit',
  cwd: path.resolve(SCRIPT_DIR, '..'),
});

child.on('exit', (code) => {
  process.exit(code ?? 0);
});
