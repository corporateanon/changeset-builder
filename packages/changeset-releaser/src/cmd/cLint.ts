import { CommandModule } from 'yargs';
import { getMonorepoData } from '../core';
import { ExecutionPlanner, TargetGroup } from '../ExecutionPlanner';
import { PlanExecutor } from '../PlanExecutor';
import { ScriptRunnerYarn } from '../ScriptRunner';

interface Args {}

const LintCommand: CommandModule<{}, Args> = {
  command: 'lint',
  builder: {},
  describe: 'Lint changed packages',
  async handler() {
    const monorepo = await getMonorepoData(process.cwd());
    const executor = new PlanExecutor(
      new ExecutionPlanner(monorepo),
      new ScriptRunnerYarn()
    );
    await executor.runScript(TargetGroup.Changed, 'lint');
  }
};
export default LintCommand;
