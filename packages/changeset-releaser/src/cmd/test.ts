import chalk from 'chalk';
import execa from 'execa';
import { CommandModule } from 'yargs';
import { getMonorepoData, printList } from '../core';

interface Args {}
const TestCommand: CommandModule<Args> = {
  command: 'test',
  builder: {},
  describe: 'Test changed packages',
  async handler() {
    const {
      packagesToBeTested,
      changedPackages,
      packageCapabilities
    } = await getMonorepoData(process.cwd());

    printList('Changed packages', changedPackages);
    printList('Packages to be tested', packagesToBeTested);

    for (const pkg of packagesToBeTested) {
      if (!packageCapabilities.testable.has(pkg)) {
        console.log(
          chalk`💤  {yellow [TEST][SKIP] Package "${pkg}" does not have "test" script}`
        );
        continue;
      }
      console.log(chalk`\n⚙️  {bold [TEST] Building package: "${pkg}"}\n`);

      await execa('yarn', ['workspace', pkg, 'run', 'test'], {
        stdio: 'inherit'
      });
    }
  }
};
export default TestCommand;
