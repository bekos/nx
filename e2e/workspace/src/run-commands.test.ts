import {
  newProject,
  readJson,
  runCLI,
  uniq,
  updateFile,
  workspaceConfigName,
} from '@nrwl/e2e/utils';

describe('Run Commands', () => {
  beforeAll(() => newProject());

  it('should not override environment variables already set when setting a custom env file path', async (done) => {
    const nodeapp = uniq('nodeapp');
    updateFile(
      `.env`,
      'SHARED_VAR=shared-root-value\nROOT_ONLY=root-only-value'
    );
    runCLI(`generate @nrwl/express:app ${nodeapp}`);
    updateFile(
      `apps/${nodeapp}/.custom.env`,
      'SHARED_VAR=shared-nested-value\nNESTED_ONLY=nested-only-value'
    );

    const command =
      process.platform === 'win32'
        ? `"echo %SHARED_VAR% %ROOT_ONLY% %NESTED_ONLY%"`
        : `'echo "\\$SHARED_VAR" "\\$ROOT_ONLY" "\\$NESTED_ONLY"'`;
    const envFile = `apps/${nodeapp}/.custom.env`;
    runCLI(
      `generate @nrwl/workspace:run-commands echoEnvVariables --command=${command} --envFile=${envFile} --project=${nodeapp}`
    );

    const result = runCLI('echoEnvVariables');
    expect(result).toContain('shared-root-value');
    expect(result).not.toContain('shared-nested-value');
    expect(result).toContain('root-only-value');
    expect(result).toContain('nested-only-value');
    done();
  }, 120000);

  it('should interpolate provided arguments', async (done) => {
    const myapp = uniq('myapp1');

    runCLI(`generate @nrwl/web:app ${myapp}`);

    const config = readJson(workspaceConfigName());
    config.projects[myapp].targets.echo = {
      executor: '@nrwl/workspace:run-commands',
      options: {
        commands: [`echo 'print: {args.var1}'`, `echo 'print: {args.var2}'`],
      },
    };
    updateFile(workspaceConfigName(), JSON.stringify(config));

    const result = runCLI(`run ${myapp}:echo --var1=x --var2=y`);
    expect(result).toContain('print: x');
    expect(result).toContain('print: y');
    done();
  }, 120000);

  it.only('should fail when a process exits non-zero', () => {
    const myapp = uniq('myapp1');

    runCLI(`generate @nrwl/web:app ${myapp}`);

    const config = readJson(workspaceConfigName());
    config.projects[myapp].targets.error = {
      executor: '@nrwl/workspace:run-commands',
      options: {
        command: `exit 1`,
      },
    };
    updateFile(workspaceConfigName(), JSON.stringify(config));

    try {
      runCLI(`run ${myapp}:error`);
      fail('Should error if process errors');
    } catch (e) {
      expect(e.stderr.toString()).toContain(
        'Something went wrong in @nrwl/run-commands - Command failed: exit 1'
      );
    }
  });
});
