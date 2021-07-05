import chalk from 'chalk';
import execa from 'execa';
import { CommandModule } from 'yargs';
import { getMonorepoData, printList } from '../core';

interface Args {}
const BuildCommand: CommandModule<Args> = {
  command: 'build',
  builder: {},
  describe: 'Build changed packages',
  async handler() {
    const {
      packagesToBeBuilt,
      changedPackages,
      packageCapabilities
    } = await getMonorepoData(process.cwd());

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
        stdio: 'inherit'
      });
    }
  }
};
export default BuildCommand;
