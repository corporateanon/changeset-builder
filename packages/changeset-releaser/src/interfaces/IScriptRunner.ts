export interface IScriptRunner {
    run(pkg: string, script: string): Promise<void>;
  }
  