#!/usr/bin/env node
import yargs from 'yargs';
import BuildCommand from './cmd/cBuild';
import LintCommand from './cmd/cLint';
import RunCommand from './cmd/cRun';
import TestCommand from './cmd/cTest';

const main = async () => {
  yargs
    .command(BuildCommand)
    .command(TestCommand)
    .command(LintCommand)
    .command(RunCommand)
    .demandCommand()
    .help().argv;
};

main().catch(e => {
  console.error(e.stack);
  process.exit(1);
});
