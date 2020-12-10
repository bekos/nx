import { execSync, spawn } from 'child_process';
import * as chalk from 'chalk';
import { removeSync } from 'fs-extra';
const exitHook = require('exit-hook');

const argv = require('yargs')
  .usage('Starts a local registry.')
  .command(
    'disable',
    'Deleting NPM/Yarn registry',
    (yargs: any) => yargs,
    () => {
      log(`Deleting registries`);
      disable();
      process.exit(0);
    }
  )
  .command(
    'clear',
    'Clear files from local registry',
    (yargs: any) => yargs,
    () => {
      log(`Clearing local registry`);
      removeSync('./build/local-registry/storage');
      process.exit(0);
    }
  )
  .option('port', {
    alias: 'p',
    type: 'number',
    default: 4873,
  }).argv;

const registry = `http://localhost:${argv.port}`;

exitHook(() => {
  log(`Reverting registries`);
  disable();
});

log(`Setting registry to local registry`);
['npm', 'yarn'].forEach((pm) => {
  execSync(`${pm} config set registry ${registry}`);
  console.log(`✔️  ${chalk.bold(pm)}`);
});

log(`Starting local registry server`);
spawn(
  'npx',
  ['verdaccio', '--config ./.verdaccio/config.yml', `--listen ${argv.port}`],
  { shell: true, stdio: 'inherit' }
);

function disable() {
  ['npm', 'yarn'].forEach((pm) =>
    execSync(`${pm} config delete registry`, { stdio: 'inherit' })
  );
  // process.exit(1);
}

function log(message) {
  console.log(`\n${chalk.bold.magenta(message)}`);
}
