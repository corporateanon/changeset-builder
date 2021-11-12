import { TargetGroup } from '../ExecutionPlanner';

export interface IPlanExecutor {
  runScript(group: TargetGroup, script: string): Promise<void>;
}
