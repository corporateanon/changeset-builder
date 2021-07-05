import execa from 'execa';
import yargs from 'yargs';
import chalk from 'chalk';
import { getMonorepoData, printList } from './core';

async function main() {
  //read options using yargs
  const { directory } = await yargs.option('directory', {
    demandOption: true,
    type: 'string',
    description: 'Root directory of the monorepo',
  }).argv;

  const {
    packagesToBeTested,
    packagesToBeBuilt,
    changedPackages,
    packageCapabilities,
  } = await getMonorepoData(directory);

  printList('Changed packages', changedPackages);
  printList('Packages to be tested', packagesToBeTested);

  for (const pkg of packagesToBeBuilt) {
    if (!packageCapabilities.testable.has(pkg)) {
      console.log(
        chalk`💤  {yellow [TEST][SKIP] Package "${pkg}" does not have "test" script}`
      );
      continue;
    }
    console.log(chalk`\n⚙️  {bold [TEST] Testing package: "${pkg}"}\n`);

    await execa('yarn', ['workspace', pkg, 'run', 'test'], {
      stdio: 'inherit',
    });
  }
}

main().catch((e) => {
  console.error(e.stack);
  process.exit(1);
});
