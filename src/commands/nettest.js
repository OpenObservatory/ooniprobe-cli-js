import mri from 'mri'
import range from 'lodash.range'

import chalk from 'chalk'
import info from '../cli/output/info'
import header from '../cli/output/header'
import error from '../cli/output/error'

import optionPad from '../cli/output/option-pad'

import exit from '../util/exit'

import camelCase from 'camelcase'
import nettests from '../nettests'

const debug = require('debug')('commands.nettest')

const help = () => {
  const options = [
      {
        option: '-h, --help',
        description: 'Display usage information'
      },
      {
        option: `-o, --output ${chalk.bold.underline('OUTPUT')}`,
        description: 'Path to write measurements to'
      },
  ]

  const nettestOptions = Object.keys(nettests).map(name => ({
    option: chalk.bold(name),
    description: nettests[name].shortDescription
  }))

  console.log(`
  ${header}

  ${chalk.dim('Usage:')}

    ooni nettest [options] <nettest> [options]

  ${chalk.dim('Nettests:')}

    ${nettestOptions.map((opt) => optionPad(opt, 80)).join('\n    ')}

  ${chalk.dim('Options:')}

    ${options.map((opt) => optionPad(opt, 80)).join('\n    ')}

`)
}

const run = async ({nettest, argv}) => {
  if (nettest === undefined) {
    console.log(error(`Could not find nettest called ${name} (${camelName})`))
    return exit(1)
  }
  console.log(info(`Running ${chalk.bold(nettest.name)}`))
  await nettest.run(argv)
}

// Define these as module level variables so we don't have to pass them along
let argv
let subcommand
const main = async ctx => {
  argv = mri(ctx.argv.slice(2), {
    boolean: ['help'],
    alias: {
      help: 'h'
    }
  })

  argv._ = argv._.slice(1)
  subcommand = argv._[0]

  debug('subcommand', subcommand)
  debug('argv', argv)
  debug('argv._[1]', argv._[1])

  if ((subcommand === 'nettest' || subcommand === 'nt') && argv.help) {
     if (argv._[1]) {
      // if help flag has been passed without minus prefix
      // increment subcommand argument index
      subcommand = argv._[1]
    } else {
      // if this is the case then it means we should show the help
      help()
      await exit(0)
    }
  } else if (!subcommand && argv.help) {
    // When `--help` is passed we only show the general help when no subcommand
    // is present (second statement for when help has been used without minux prefix)
    help()
    await exit(0)
  }
  try {
    const camelName = camelCase(subcommand)
    if (!nettests[camelName]) {
      // if nettest doesn't exist show available nettests
      console.log(error(`Nettest "${camelName}" not found`))
      help()
      await exit(1)
      return
    }
    const nettest = new nettests[camelName]
    if (argv.help) {
      console.log(nettest.help)
      await exit(0)
    } else {
      await run({nettest, argv})
    }
  } catch(err) {
    if (err.usageError) {
      console.error(error(err.message))
    } else {
      console.error(error(`Unknown error: ${err}\n${err.stack}`))
    }
    await exit(1)
  }

}

export default main
