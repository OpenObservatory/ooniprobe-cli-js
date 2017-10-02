import chalk from 'chalk'
import mri from 'mri'

import exit from '../util/exit'

import info from '../cli/output/info'
import logo from '../cli/output/logo'
import error from '../cli/output/error'

import camelCase from 'camelcase'

import { bold } from 'chalk'
import Progress from 'progress'

const nettests = {
  webConnectivity: {
    name: 'Web Connectivity',
		shortDescription: 'Test for web censorship',
    run: async (options) => {
      console.log(options)
      return exit(0)
    }
  }
}

const help = () => {
  console.log(`
  ${chalk.bold(chalk.blue(logo))} ooni nettest [options] <nettest> [options]

  ${chalk.dim('Nettests:')}
    ${Object.keys(nettests).map((name) => `${name}  [options]  ${nettests[name].shortDescription}`)}

  ${chalk.dim('Options:')}
    -h, --help                          Output usage information
    -o ${chalk.bold.underline('OUTPUT')},       Path to write report output to
  `)
}

const run = async ({nettest}) => {
  if (nettest === undefined) {
    console.log(error(`Could not find nettest called ${name} (${camelName})`))
    return exit(1)
  }
  console.log(info(`Running ${bold(nettest.name)}`))
  await nettest.run()
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

  if (argv.help || !subcommand) {
    help()
    await exit(0)
  }

  try {
    const camelName = camelCase(subcommand)
    const nettest = nettests[camelName]
    await run({nettest})
  } catch(err) {
    if (err.usageError) {
      console.error(error(err.message))
    } else {
      console.error(error(`Unknown error: ${err}\n${err.stack}`))
    }
    exit(1)
  }

}

export default main
