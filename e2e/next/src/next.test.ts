import { stringUtils } from '@nrwl/workspace';
import {
  checkFilesExist,
  newProject,
  readFile,
  readJson,
  runCLI,
  runCLIAsync,
  uniq,
  updateFile,
} from '@nrwl/e2e/utils';

describe('Next.js Applications', () => {
  it('should be able to serve with a proxy configuration', async () => {
    newProject();
    const appName = uniq('app');

    runCLI(`generate @nrwl/next:app ${appName}`);

    const proxyConf = {
      '/external-api': {
        target: 'http://localhost:4200',
        pathRewrite: {
          '^/external-api/hello': '/api/hello',
        },
      },
    };
    updateFile(`apps/${appName}/proxy.conf.json`, JSON.stringify(proxyConf));

    updateFile(
      `apps/${appName}-e2e/src/integration/app.spec.ts`,
      `
        describe('next-app', () => {
          beforeEach(() => cy.visit('/'));
        
          it('should ', () => {
            cy.get('h1').contains('Hello Next.js!');
          });
        });
        `
    );

    updateFile(
      `apps/${appName}/pages/index.tsx`,
      `
        import React, { useEffect, useState } from 'react';

        export const Index = () => {
          const [greeting, setGreeting] = useState('');
        
          useEffect(() => {
            fetch('/external-api/hello')
              .then(r => r.text())
              .then(setGreeting);
          }, []);
        
          return <h1>{greeting}</h1>;
        };
        export default Index;        
      `
    );

    updateFile(
      `apps/${appName}/pages/api/hello.js`,
      `
        export default (_req, res) => {
          res.status(200).send('Hello Next.js!');
        };            
      `
    );
  }, 120000);

  it('should be able to consume a react lib', async () => {
    newProject();
    const appName = uniq('app');
    const libName = uniq('lib');

    runCLI(`generate @nrwl/next:app ${appName} --no-interactive`);

    runCLI(`generate @nrwl/react:lib ${libName} --no-interactive --style=none`);

    const mainPath = `apps/${appName}/pages/index.tsx`;
    updateFile(mainPath, `import '@proj/${libName}';\n` + readFile(mainPath));

    // Update lib to use css modules
    updateFile(
      `libs/${libName}/src/lib/${libName}.tsx`,
      `
        import React from 'react';
        import styles from './style.module.css';
        export function Test() {
          return <div className={styles.container}>Hello</div>;
        }
      `
    );
    updateFile(
      `libs/${libName}/src/lib/style.module.css`,
      `
        .container {}
      `
    );

    await checkApp(appName, {
      checkUnitTest: true,
      checkLint: true,
      checkE2E: false,
    });
  }, 120000);
});

async function checkApp(
  appName: string,
  opts: { checkUnitTest: boolean; checkLint: boolean; checkE2E: boolean }
) {
  if (opts.checkLint) {
    const lintResults = runCLI(`lint ${appName}`);
    expect(lintResults).toContain('All files pass linting.');
  }

  if (opts.checkUnitTest) {
    const testResults = await runCLIAsync(`test ${appName}`);
    expect(testResults.combinedOutput).toContain(
      'Test Suites: 1 passed, 1 total'
    );
  }

  if (opts.checkE2E) {
    const e2eResults = runCLI(`e2e ${appName}-e2e --headless`);
    expect(e2eResults).toContain('All specs passed!');
  }

  const buildResult = runCLI(`build ${appName}`);
  expect(buildResult).toContain(`Compiled successfully`);
  checkFilesExist(`dist/apps/${appName}/.next/build-manifest.json`);
  checkFilesExist(`dist/apps/${appName}/public/star.svg`);

  const packageJson = readJson(`dist/apps/${appName}/package.json`);
  expect(packageJson.dependencies.react).toBeDefined();
  expect(packageJson.dependencies['react-dom']).toBeDefined();
  expect(packageJson.dependencies.next).toBeDefined();

  runCLI(`export ${appName}`);
  checkFilesExist(`dist/apps/${appName}/exported/index.html`);
}
