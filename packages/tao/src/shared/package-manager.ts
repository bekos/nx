import { existsSync } from 'fs';
import { join } from 'path';

export function detectPackageManager(dir = '') {
  return existsSync(join(dir, 'yarn.lock'))
    ? 'yarn'
    : existsSync(join(dir, 'pnpm-lock.yaml'))
    ? 'pnpm'
    : 'npm';
}

export function getPackageManagerCommand(
  packageManager = detectPackageManager()
): {
  install: string;
  add: string;
  addDev: string;
  exec: string;
} {
  switch (packageManager) {
    case 'yarn':
      return {
        install: 'yarn',
        add: 'yarn add',
        addDev: 'yarn add -D',
        exec: 'yarn',
      };

    case 'pnpm':
      return {
        install: 'pnpm install',
        add: 'pnpm add',
        addDev: 'pnpm add -D',
        exec: 'pnpx',
      };

    case 'npm':
      return {
        install: 'npm install',
        add: 'npm install',
        addDev: 'npm install -D',
        exec: 'npx',
      };
  }
}
