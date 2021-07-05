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
    packagesToBeBuilt,
    changedPackages,
    packageCapabilities,
  } = await getMonorepoData(directory);
  
  printList('Changed packages', changedPackages);
  printList('Packages to be built', packagesToBeBuilt);

  for (const pkg of packagesToBeBuilt) {
    if (!packageCapabilities.buildable.has(pkg)) {
      console.log(
        chalk`💤  {yellow [BUILD][SKIP] Package "${pkg}" does not have "build" script}`
      );
      continue;
    }
    console.log(chalk`\n⚙️  {bold [BUILD] Building package: "${pkg}"}\n`);

    await execa('yarn', ['workspace', pkg, 'run', 'build'], {
      stdio: 'inherit',
    });
  }
}

main().catch((e) => {
  console.error(e.stack);
  process.exit(1);
});
