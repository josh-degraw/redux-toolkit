#!/usr/bin/env node

import program from 'commander';
import { dirname, resolve } from 'path';
import { generateEndpoints, parseConfig } from '../';

let ts = false;
try {
  if (require.resolve('esbuild') && require.resolve('esbuild-runner')) {
    require('esbuild-runner/register');
  }
  ts = true;
} catch {}

try {
  if (!ts) {
    if (require.resolve('typescript') && require.resolve('ts-node')) {
      require('ts-node/register/transpile-only');
    }

    ts = true;
  }
} catch {}

// tslint:disable-next-line
const meta = require('../../package.json');

program.version(meta.version).usage('</path/to/config.js>').parse(process.argv);

const configFile = program.args[0];

if (program.args.length === 0 || !/\.(jsx?|tsx?|jsonc?)?$/.test(configFile)) {
  program.help();
} else {
  if (/\.tsx?$/.test(configFile) && !ts) {
    console.error('Encountered a TypeScript configfile, but neither esbuild-runner nor ts-node are installed.');
    process.exit(1);
  }
  run(resolve(process.cwd(), configFile));
}

async function run(configFile: string) {
  process.chdir(dirname(configFile));

  const unparsedConfig = require(configFile);

  for (const config of parseConfig(unparsedConfig.default ?? unparsedConfig)) {
    try {
      console.log(`Generating ${config.outputFile}`);
      await generateEndpoints(config);
      console.log(`Done`);
    } catch (err) {
      console.error(err);
      process.exit(1);
    }
  }
}