#!/usr/bin/env node

import mri from 'mri'

import { blue, bold } from 'chalk'

import commands from './commands'
import logo from './cli/output/logo'
import error from './cli/output/error'

/*
commander
  .version(require('../package').version)
  .description(`${blue(logo)} ${bold('OONI Probe')} - Measure Internet Censorship, Speed & Performance`)
  // Look into: https://www.npmjs.com/package/node-ipc
  .option('--ipc', 'Enable inter process communication mode')

commander
  .command('run')
  .description('Run in unattended mode')
  .action(actions.run)

commander
  .command('nettest [name]').alias('nt')
  .description('Displays the information tests')
  .action(actions.nettest)

commander
  .command('list [nettests | results]').alias('ls')
  .description('Displays the measurements collected so far')
  .action(actions.list)

commander
  .command('upload [path]')
  .option('Uploads a measurement file to the ooni collector')
  .action(actions.upload)

commander
  .command('info [path]')
  .description('Displays information about your running probe')
  .action(actions.info)

commander
  .command('help [cmd]')
  .description('Displays help for the specific command')
*/

const main = (argv_) => {
  const argv = mri(argv_, {
    boolean: ['help', 'version'],
    string: [],
    alias: {
      help: 'h',
      version: 'v'
    }
  })

  let subcommand = argv._[2]
  if (!subcommand) {
    if (argv.version) {
      console.log(require('../package').version)
      return 0
    }
  }
  const ctx = {
    argv: argv_
  }

  if (subcommand === 'help') {
    subcommand = argv._[3]
    ctx.argv.push('-h')
  }

  switch(subcommand) {
    case 'run': {
      return commands.run(ctx)
    }
    case 'nt':
    case 'nettest': {
      return commands.nettest(ctx)
    }
    case 'info': {
      return commands.info(ctx)
    }
    case 'ls':
    case 'list': {
      return commands.list(ctx)
    }
  }
}

main(process.argv)
