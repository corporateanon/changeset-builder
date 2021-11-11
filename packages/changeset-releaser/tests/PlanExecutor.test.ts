import { MonorepoData } from '../src/core';
import { ExecutionPlanner, TargetGroup } from '../src/ExecutionPlanner';
import { IScriptRunner } from '../src/interfaces/IScriptRunner';
import { PlanExecutor } from '../src/PlanExecutor';

class MockScriptRunner implements IScriptRunner {
  async run(pkg: string, script: string): Promise<void> {}
}

describe('PlanExecutor', () => {
  it('should execute script execution plan', async () => {
    const monorepo: MonorepoData = {
      changedPackages: ['pkg1', 'pkg2', 'pkg3'],
      packageScripts: {
        pkg1: new Set(['build']),
        pkg3: new Set(['build'])
      },
      packagesToBuild: ['pkg1', 'pkg2', 'pkg3'],
      packagesToTest: []
    };

    const scriptRunner = new MockScriptRunner();
    const runSpy = jest.spyOn(scriptRunner, 'run');

    const executor = new PlanExecutor(
      new ExecutionPlanner(monorepo),
      scriptRunner
    );

    await executor.runScript(TargetGroup.Build, 'build');

    expect(runSpy.mock.calls).toMatchInlineSnapshot(`
      Array [
        Array [
          "pkg1",
          "build",
        ],
        Array [
          "pkg3",
          "build",
        ],
      ]
    `);
  });
});
