#!/usr/bin/env node
import yargs from 'yargs';
import BuildCommand from './cmd/build';
import TestCommand from './cmd/test';

const main = async () => {
  yargs
    .command(BuildCommand)
    .command(TestCommand)
    .demandCommand()
    .help().argv;
};

main().catch(e => {
  console.error(e.stack);
  process.exit(1);
});
