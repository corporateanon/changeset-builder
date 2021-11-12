import chalk from 'chalk';
import { ExecutionPlanner, TargetGroup } from './ExecutionPlanner';
import { IPlanExecutor } from './interfaces/IPlanExecutor';
import { IScriptRunner } from './interfaces/IScriptRunner';

export class PlanExecutor implements IPlanExecutor {
  constructor(
    private planner: ExecutionPlanner,
    private runner: IScriptRunner
  ) {}

  async runScript(group: TargetGroup, script: string): Promise<void> {
    const plan = this.planner.createPlan(group, script);

    if (plan.changedPackages.length) {
      console.log(chalk`\nℹ️ The following packages were changed:`);
      for (const pkg of plan.changedPackages) {
        console.log(` - ${pkg}`);
      }
    }

    if (plan.usedPackages.length) {
      console.log(
        chalk`\nℹ️ Going to run {bold ${script}} script on the following packages:`
      );
      for (const pkg of plan.usedPackages) {
        console.log(` - ${pkg}`);
      }
    }

    if (plan.skippedPackages.length) {
      console.log(
        chalk`⚠️ The following packages do not provide {bold ${script}} script and will be skipped:`
      );
      for (const pkg of plan.skippedPackages) {
        console.log(` - ${pkg}`);
      }
    }

    for (const pkg of plan.usedPackages) {
      console.log(
        chalk`\n⚙️ {underline Running {bold ${script}} on {bold ${pkg}}}\n`
      );
      await this.runner.run(pkg, script);
    }
  }
}
