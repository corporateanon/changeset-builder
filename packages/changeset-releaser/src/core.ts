import chalk from 'chalk';
import { DepGraph } from 'dependency-graph';
import execa from 'execa';
import fs from 'fs';
import globby from 'globby';
import { asyncReduce } from 'iter-tools';
import { join } from 'path';
import YAML from 'yaml';

interface PackagesCapabilities {
  buildable: ReadonlySet<string>;
  testable: ReadonlySet<string>;
}

interface MonorepoData {
  changedPackages: ReadonlySet<string>;
  packagesToBeBuilt: string[];
  packagesToBeTested: ReadonlySet<string>;
  packageCapabilities: PackagesCapabilities;
}

interface WorkspaceInfo {
  location: string;
  workspaceDependencies: string[];
  mismatchedWorkspaceDependencies: string[];
}

interface WorkspacesInfo {
  [packageName: string]: WorkspaceInfo;
}

async function getChangedPackages(): Promise<ReadonlySet<string>> {
  const files = await globby(['.changeset/*.md', '!.changeset/README.md']);

  async function* getPackagesFromFiles(files: string[]) {
    for (const file of files) {
      const markdownWithYaml = await fs.promises.readFile(file, 'utf8');
      const [, yamlHeader] = markdownWithYaml.split(/^---\n/gm);
      const data = YAML.parse(yamlHeader);
      yield Object.keys(data);
    }
  }

  const changedPackages = await asyncReduce(
    new Set<string>(),
    (result, packages) => {
      for (const pkg of packages) {
        result.add(pkg);
      }
      return result;
    },
    getPackagesFromFiles(files)
  );

  return changedPackages;
}

async function getWorkspacesInfo(): Promise<WorkspacesInfo> {
  const { stdout } = await execa('yarn', ['workspaces', 'info']);
  //TODO: use yarn --json and json-lines
  const lines = stdout
    .split('\n')
    .filter(line => !line.startsWith('yarn') && !line.startsWith('Done'));
  const data = JSON.parse(lines.join('\n'));
  return data;
}

function createDependencyGraph(workspaces: WorkspacesInfo): DepGraph<void> {
  const dependencyGraph = new DepGraph();
  for (const pkg of Object.keys(workspaces)) {
    dependencyGraph.addNode(pkg);
  }
  for (const [pkg, info] of Object.entries(workspaces)) {
    for (const dependency of info.workspaceDependencies) {
      dependencyGraph.addDependency(pkg, dependency);
    }
  }
  return dependencyGraph;
}

function getPackagesToBeTested(
  changedPackages: ReadonlySet<string>,
  dependencyGraph: DepGraph<void>
): ReadonlySet<string> {
  const packagesToBeTested = new Set<string>();
  for (const pkg of changedPackages) {
    packagesToBeTested.add(pkg);
    for (const dependentPackage of dependencyGraph.dependentsOf(pkg)) {
      packagesToBeTested.add(dependentPackage);
    }
  }
  return packagesToBeTested;
}

function getPackagesToBeBuilt(
  packagesToBeTested: ReadonlySet<string>,
  dependencyGraph: DepGraph<void>
): string[] {
  const unorderedPackagesToBeBuilt = new Set<string>();
  for (const pkg of packagesToBeTested) {
    unorderedPackagesToBeBuilt.add(pkg);
    for (const dependencyPkg of dependencyGraph.dependenciesOf(pkg)) {
      unorderedPackagesToBeBuilt.add(dependencyPkg);
    }
  }

  const buildOrder = dependencyGraph.overallOrder();
  return buildOrder.filter(pkg => unorderedPackagesToBeBuilt.has(pkg));
}

export function printList(title: string, list: Iterable<string>) {
  console.log(chalk`{bold ${title}:}`);
  for (const item of list) {
    console.log(chalk` - {green ${item}}`);
  }
  console.log();
}

async function getPackageJson(
  workspacesInfo: WorkspacesInfo,
  pkg: string
): Promise<null | { scripts?: { [scriptName: string]: string } }> {
  const pkgDir = workspacesInfo[pkg]?.location ?? null;
  if (!pkgDir) {
    return null;
  }
  const packageFile = join(pkgDir, 'package.json');
  return JSON.parse(await fs.promises.readFile(packageFile, 'utf8'));
}

async function getPackagesCapabilities(
  workspacesInfo: WorkspacesInfo
): Promise<PackagesCapabilities> {
  const caps = {
    buildable: new Set<string>(),
    testable: new Set<string>()
  };
  for (const pkg of Object.keys(workspacesInfo)) {
    const packageJSON = await getPackageJson(workspacesInfo, pkg);
    if (packageJSON?.scripts?.test) {
      caps.testable.add(pkg);
    }
    if (packageJSON?.scripts?.build) {
      caps.buildable.add(pkg);
    }
  }
  return caps;
}

export async function getMonorepoData(
  directory: string
): Promise<MonorepoData> {
  process.chdir(directory);

  const changedPackages = await getChangedPackages();

  const workspacesInfo = await getWorkspacesInfo();

  const dependencyGraph = createDependencyGraph(workspacesInfo);

  const packagesToBeTested = getPackagesToBeTested(
    changedPackages,
    dependencyGraph
  );

  const packagesToBeBuilt = getPackagesToBeBuilt(
    packagesToBeTested,
    dependencyGraph
  );

  const packageCapabilities = await getPackagesCapabilities(workspacesInfo);

  return {
    changedPackages,
    packagesToBeBuilt,
    packagesToBeTested,
    packageCapabilities
  };
}
