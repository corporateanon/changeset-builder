import execa from 'execa';
import { IScriptRunner } from './interfaces/IScriptRunner';

export class ScriptRunnerYarn implements IScriptRunner {
  async run(pkg: string, script: string): Promise<void> {
    await execa('yarn', ['workspace', pkg, 'run', script], {
      stdio: 'inherit'
    });
  }
}
