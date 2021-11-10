import { mkdir, rm, writeFile } from 'fs/promises';
import { IPackageJson } from 'package-json-type';
import { join, resolve } from 'path';
import copy from 'recursive-copy';
import { v4 as uuid } from 'uuid';

const ROOT = resolve(join(__dirname, '../../..'));
const SANDBOX = join(ROOT, 'sandbox');
const TMP = join(ROOT, '.tmp');
const MUTABLE_SANDBOX = join(TMP, 'sandbox');
const CHANGESET = join(MUTABLE_SANDBOX, '.changeset');

export async function prepareSandbox(): Promise<{ root: string }> {
  await rm(TMP, { recursive: true, force: true });
  await mkdir(TMP, { recursive: true });
  await copy(SANDBOX, MUTABLE_SANDBOX);
  return {
    root: MUTABLE_SANDBOX
  };
}

async function createPackage(manifest: IPackageJson) {
  const packageFolderName = manifest.name
    .replace(/@/g, '')
    .replace(/[^\w-_]+/, '_');
  const packageFolder = join(MUTABLE_SANDBOX, 'packages', packageFolderName);
  await mkdir(packageFolder, { recursive: true });

  await writeFile(
    join(packageFolder, 'package.json'),
    JSON.stringify(manifest, null, 2),
    'utf8'
  );
}

export async function createPackages(manifests: IPackageJson[]) {
  for (const manifest of manifests) {
    await createPackage(manifest);
  }
}

type Changeset = Record<string, 'major' | 'minor' | 'patch'>;

export async function createChangeset(changeset: Changeset) {
  const docBlock = Object.entries(changeset)
    .map(([pkg, bump]) => `${pkg}: ${bump}`)
    .join('\n');
  const contents = `---\n${docBlock}\n---\n`;
  const name = `${uuid()}.md`;
  await writeFile(join(CHANGESET, name), contents, 'utf8');
}
