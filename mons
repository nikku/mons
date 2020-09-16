#!/usr/bin/env node

const { execSync } = require('child_process');

const reset = process.argv.includes('-o') || process.argv.includes('--off') || process.argv.includes('--reset');

const verbose = process.argv.includes('--verbose');

const help = process.argv.includes('--help');

/**
 * Screen configurations, will be matched from last to first with
 * first screen being the default configuration that is used with -o
 */
const configs = [
  [ { monitor: 'eDP-1', primary: true } ],
  [ { monitor: 'DP-2-1', primary: true, scale: '1.54x1.54' }, { monitor: 'eDP-1', leftOf: 'DP-2-1' } ],
  [ { monitor: 'DP-2-2', primary: true, scale: '1.54x1.54' }, { monitor: 'DP-2-3', rightOf: 'DP-2-2' } ]
];


function exec(cmd) {

  if (verbose) {
    console.log('X:', cmd);
  }

  const result = execSync(cmd).toString('utf8');

  if (verbose) {
    console.log('Y:', result);
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
    c.scale ? `--scale ${c.scale}` : '',
    c.leftOf ? `--left-of ${c.leftOf}` : '',
    c.rightOf ? `--right-of ${c.rightOf}` : '',
    c.above ? `--above ${c.above}` : '',,
    c.below ? `--below ${c.below}` : ''
  ]).flat().join(' ');

  exec(`xrandr ${switchOf} ${enable}`.replace(/\s+/g, ' '));
}

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

const activeMonitors = getActiveMonitors();

const monitors = getConnectedMonitors();

// detect
const config = reset ? configs[0] : detectConfig(configs, monitors);

// apply
applyConfig(config, activeMonitors);
