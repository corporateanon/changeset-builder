import { CommandModule } from 'yargs';
import { getMonorepoData } from '../core';
import { ExecutionPlanner, TargetGroup } from '../ExecutionPlanner';
import { PlanExecutor } from '../PlanExecutor';
import { ScriptRunnerYarn } from '../ScriptRunner';

interface Args {
  script: string;
  group: TargetGroup;
}

const RunCommand: CommandModule<{}, Args> = {
  command: 'run <group> <script>',
  describe: 'Run a script in the specified package group',
  builder: yargs =>
    yargs
      .positional('group', {
        choices: Object.values(TargetGroup),
        demandOption: true
      })
      .positional('script', {
        type: 'string',
        demandOption: true
      }),
  async handler({ group, script }) {
    const monorepo = await getMonorepoData(process.cwd());
    const executor = new PlanExecutor(
      new ExecutionPlanner(monorepo),
      new ScriptRunnerYarn()
    );
    await executor.runScript(group, script);
  }
};
export default RunCommand;
