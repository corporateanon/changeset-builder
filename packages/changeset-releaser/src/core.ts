import assert from 'assert';
import chalk from 'chalk';
import { DepGraph } from 'dependency-graph';
import execa from 'execa';
import fs from 'fs';
import globby from 'globby';
import { asyncReduce } from 'iter-tools';
import { IPackageJson } from 'package-json-type';
import { join } from 'path';
import YAML from 'yaml';

type PackageScripts = Record<string, ReadonlySet<string>>;

export interface MonorepoData {
  changedPackages: string[];
  packagesToBuild: string[];
  packagesToTest: string[];
  packageScripts: PackageScripts;
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
  const { stdout } = await execa('yarn', ['--json', 'workspaces', 'info']);
  const { type, data: dataJson } = JSON.parse(stdout);
  assert.strictEqual(type, 'log');
  const data = JSON.parse(dataJson);
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

/**
 * Get packages and their recursive dependents
 */
function getUpstreamPackages(
  packages: Iterable<string>,
  dependencyGraph: DepGraph<void>
): string[] {
  const unorderedPackages = new Set<string>();
  for (const pkg of packages) {
    unorderedPackages.add(pkg);
    for (const dependentPackage of dependencyGraph.dependentsOf(pkg)) {
      unorderedPackages.add(dependentPackage);
    }
  }
  const order = dependencyGraph.overallOrder();
  return order.filter(pkg => unorderedPackages.has(pkg));
}

/**
 * Get packages and their recursive dependencies
 */
function getDownstreamPackages(
  packages: Iterable<string>,
  dependencyGraph: DepGraph<void>
): string[] {
  const unorderedPackages = new Set<string>();
  for (const pkg of packages) {
    unorderedPackages.add(pkg);
    for (const dependencyPkg of dependencyGraph.dependenciesOf(pkg)) {
      unorderedPackages.add(dependencyPkg);
    }
  }

  const order = dependencyGraph.overallOrder();
  return order.filter(pkg => unorderedPackages.has(pkg));
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
): Promise<null | IPackageJson> {
  const pkgDir = workspacesInfo[pkg]?.location ?? null;
  if (!pkgDir) {
    return null;
  }
  const packageFile = join(pkgDir, 'package.json');
  return JSON.parse(await fs.promises.readFile(packageFile, 'utf8'));
}

async function getPackagesScripts(
  workspacesInfo: WorkspacesInfo
): Promise<PackageScripts> {
  const scripts: PackageScripts = {};

  for (const pkg of Object.keys(workspacesInfo)) {
    const packageJSON = await getPackageJson(workspacesInfo, pkg);
    scripts[pkg] = new Set(Object.keys(packageJSON?.scripts ?? {}));
  }
  return scripts;
}

export async function getMonorepoData(
  directory: string
): Promise<MonorepoData> {
  process.chdir(directory);

  const changedPackages = await getChangedPackages();

  const workspacesInfo = await getWorkspacesInfo();

  const dependencyGraph = createDependencyGraph(workspacesInfo);

  const packagesToTest = getUpstreamPackages(changedPackages, dependencyGraph);

  const packagesToBuild = getDownstreamPackages(
    packagesToTest,
    dependencyGraph
  );

  const packageScripts = await getPackagesScripts(workspacesInfo);

  return {
    changedPackages: Array.from(changedPackages),
    packagesToBuild,
    packagesToTest,
    packageScripts
  };
}
