#!/usr/bin/env node
import yargs from 'yargs';
import BuildCommand from './cmd/build';

const main = async () => {
  yargs
    .command(BuildCommand)
    .demandCommand()
    .help().argv;
};

main().catch(e => {
  console.error(e.stack);
  process.exit(1);
});
