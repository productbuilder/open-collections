import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';

function withCargoPath(env) {
  const nextEnv = { ...env };
  if (process.platform !== 'win32') {
    return nextEnv;
  }

  const userProfile = nextEnv.USERPROFILE || '';
  if (!userProfile) {
    return nextEnv;
  }

  const cargoBin = path.join(userProfile, '.cargo', 'bin');
  const cargoExe = path.join(cargoBin, 'cargo.exe');
  if (!fs.existsSync(cargoExe)) {
    return nextEnv;
  }

  const pathKey = Object.keys(nextEnv).find((key) => key.toLowerCase() === 'path') || 'Path';
  const currentPath = String(nextEnv[pathKey] || '');
  const segments = currentPath.split(';').map((segment) => segment.trim().toLowerCase());
  const hasCargoBin = segments.includes(cargoBin.toLowerCase());
  if (!hasCargoBin) {
    nextEnv[pathKey] = `${cargoBin};${currentPath}`;
  }
  return nextEnv;
}

const args = process.argv.slice(2);
const cliEntry = path.resolve(process.cwd(), 'node_modules', '@tauri-apps', 'cli', 'tauri.js');

if (!fs.existsSync(cliEntry)) {
  console.error('Tauri CLI not found. Run `pnpm install` at the repository root first.');
  process.exit(1);
}

const child = spawn(process.execPath, [cliEntry, ...args], {
  stdio: 'inherit',
  env: withCargoPath(process.env),
  cwd: process.cwd(),
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 1);
});

