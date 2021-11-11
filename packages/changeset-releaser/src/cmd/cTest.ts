import { CommandModule } from 'yargs';
import { getMonorepoData } from '../core';
import { ExecutionPlanner, TargetGroup } from '../ExecutionPlanner';
import { PlanExecutor } from '../PlanExecutor';
import { ScriptRunnerYarn } from '../ScriptRunner';

interface Args {}

const TestCommand: CommandModule<{}, Args> = {
  command: 'test',
  builder: {},
  describe: 'Test changed packages and their dependents',
  async handler() {
    const monorepo = await getMonorepoData(process.cwd());
    const executor = new PlanExecutor(
      new ExecutionPlanner(monorepo),
      new ScriptRunnerYarn()
    );
    await executor.runScript(TargetGroup.Test, 'test');
  }
};
export default TestCommand;
