#!/usr/bin/env node

const { execSync } = require('child_process');

const {
  readFileSync,
  existsSync
} = require('fs');

const { homedir } = require('os');

const {
  join: joinPath
} = require('path');

const reset = process.argv.includes('-o') || process.argv.includes('--off') || process.argv.includes('--reset');

const verbose = process.argv.includes('--verbose');

const version = process.argv.includes('--version') || process.argv.includes('-v');

const help = process.argv.includes('--help');

if (help) {
  console.log(`
Usage: mons [-o]

Stay sane with your multi screen configuration.

Options:
  -o, --off          Switch to default configuration
      --verbose      Output xrandr commands and results

Examples:
  mons
  mons -o
`);

  process.exit(0);
}

if (version) {
  console.log(require('./package.json').version);
  process.exit(0);
}

/**
 * Screen configurations, will be matched from last to first with
 * first screen being the default configuration that is used with -o
 */
const configs = readConfig();

if (!configs) {
  console.error('E: no .monsrc configuration found');
  process.exit(1);
}

function readConfig() {

  const locations = [ process.cwd(), homedir() ];

  for (const location of locations) {
    const configPath = joinPath(location, '.monsrc');

    if (verbose) {
      console.debug(`D: checking config file ${configPath}`);
    }

    if (!existsSync(configPath)) {
      continue;
    }

    try {
      const config = JSON.parse(readFileSync(configPath, 'utf8'));

      if (verbose) {
        console.debug(`D: using config ${configPath}`);
      }

      return config;
    } catch (err) {
      console.error(`E: could not read config file ${configPath}: ${err.message}`);
    }
  }
}

function exec(cmd) {

  if (verbose) {
    console.debug('X:', cmd);
  }

  const result = execSync(cmd).toString('utf8');

  if (verbose) {
    console.debug('Y:', result);
  }

  return result;
}

function getConnectedMonitors() {
  const result = exec(`xrandr --query`);

  return result.split(/\n/).filter(l => l.includes(' connected')).map(l => l.split(/\s/)[0]);
}

function getActiveMonitors() {
  const result = exec(`xrandr --listmonitors`);

  return result.split('\n').slice(1, -1).map(l => l.split(/\s+/g).slice(-1)[0]);
}

function detectConfig(configs, monitors) {

  for (let i = configs.length; i > 0; i--) {

    const config = configs[i - 1];

    const matches = config.every(part => monitors.includes(part.monitor));

    if (matches) {
      return config;
    }
  }

  throw new Error('no matching configuration');
}

function applyConfig(config, monitors) {

  const switchOf = monitors.filter(m => config.every(c => c.monitor !== m)).map(m => `--output ${m} --off`);

  const enable = config.map(c => [
    `--output ${c.monitor}`,
    c.primary ? '--primary' : '',
    '--auto',
    c.scale ? `--scale ${c.scale}` : '--scale 1',
    c.leftOf ? `--left-of ${c.leftOf}` : '',
    c.rightOf ? `--right-of ${c.rightOf}` : '',
    c.above ? `--above ${c.above}` : '',
    c.below ? `--below ${c.below}` : ''
  ]).flat().join(' ');

  exec(`xrandr ${switchOf} ${enable}`.replace(/\s+/g, ' '));
}

const activeMonitors = getActiveMonitors();

const monitors = getConnectedMonitors();

// detect
const config = reset ? configs[0] : detectConfig(configs, monitors);

// apply
applyConfig(config, activeMonitors);
