import { MonorepoData } from './core';

export enum TargetGroup {
  Test = 'test',
  Build = 'build',
  Changed = 'changed'
}

export class ExecutionPlanner {
  constructor(private monorepoData: MonorepoData) {}
  private getPackagesByTargetGroup(group: TargetGroup): string[] {
    switch (group) {
      case TargetGroup.Build: {
        return this.monorepoData.packagesToBuild;
      }
      case TargetGroup.Changed: {
        return this.monorepoData.changedPackages;
      }
      case TargetGroup.Test: {
        return this.monorepoData.packagesToTest;
      }
      default: {
        throw new Error();
      }
    }
  }
  createPlan(group: TargetGroup, script: string) {
    const pkgs = this.getPackagesByTargetGroup(group);

    const usedPackages = pkgs.filter(pkg =>
      this.monorepoData.packageScripts?.[pkg]?.has(script)
    );
    const skippedPackages = pkgs.filter(
      pkg => !this.monorepoData.packageScripts?.[pkg]?.has(script)
    );
    return {
      changedPackages: this.monorepoData.changedPackages,
      usedPackages,
      skippedPackages
    };
  }
}
