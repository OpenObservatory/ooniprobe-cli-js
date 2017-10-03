import mri from 'mri'
import range from 'lodash.range'

import wrapAnsi from 'wrap-ansi'
import chalk from 'chalk'
import info from '../cli/output/info'
import logo from '../cli/output/logo'
import error from '../cli/output/error'
import ok from '../cli/output/ok'
import notok from '../cli/output/notok'
import wait from '../cli/output/wait'
import printOptions from '../cli/output/options'

import exit from '../util/exit'
import sleep from '../util/sleep'

import camelCase from 'camelcase'


const printNettestHelp = (nettestName, options) => {
    console.log(`
  ${chalk.blue(logo)} ${chalk.bold('OONI Probe')}

  ${chalk.bold(nettests[nettestName].name)}

  ${wrapAnsi(nettests[nettestName].shortDescription, 40)}

  ${chalk.dim('Usage:')}

    ooni nettest [options] ${nettestName} [options] <url>
`)
  printOptions(options)
}

class NettestRunner {
  /*
   * This is basically an abstract class or interface
   * */

  get name() { return 'Nettest' }
  get shortDescription() { return 'An OONI Nettest' }

  help() {
  }

  async run() {
  }
}

class HTTPHeaderFieldManipulationRunner extends NettestRunner {
  get name() { return 'HTTP Header Field Manipulation' }
  get shortDescription() { return 'Check for middle boxes' }
  async run() {
  }
}

class HTTPInvalidRequestLineRunner extends NettestRunner {
  get name() { return 'HTTP Invalid Request Line' }
  get shortDescription() { return 'Check for middle boxes' }

  help() {
  }

  async run() {
  }
}

class WebConnectivityRunner extends NettestRunner {
  get name() { return 'Web Connectivity' }
  get shortDescription() { return 'Test for web censorship' }

  async run() {
    let currentUrl
    if (argv.file) {
      // Handle testing input file
    } else {
      currentUrl = argv._.slice(1)
      if (currentUrl.length == 0) {
        console.log(
          error(
            'Your must specify either a URL or an input file'
          )
        )
        return exit(1)
      }
    }

    const testDone = wait(`testing ${currentUrl}`)
    await sleep(10000)
    testDone()

    console.log(ok(`${currentUrl} is OK`))
    console.log(notok(`${currentUrl} is NOT OK`))

    return exit(0)
  }

  help() {
    printNettestHelp('webConnectivity', [
      {
        option: '-h, --help',
        description: 'Display usage information'
      },
      {
        option: `-f, --file ${chalk.bold.underline('FILE')}`,
        description: 'The path to a list of websites to test'
      }
    ])
  }
}

const nettests = {
  webConnectivity: new WebConnectivityRunner(),
  httpInvalidRequestLine: new HTTPInvalidRequestLineRunner(),
  headerFieldManipulation: new HTTPHeaderFieldManipulationRunner(),
}

const help = () => {
  console.log(`
  ${chalk.bold(chalk.blue(logo))} ooni nettest [options] <nettest> [options]

  ${chalk.dim('Nettests:')}

    ${Object.keys(nettests).map((name) => `${name}  [options]  ${nettests[name].shortDescription}`).join('\n')}

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
  console.log(info(`Running ${chalk.bold(nettest.name)}`))
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

  if (!subcommand) {
    // When `--help` is passed we only show the general help when no subcommand
    // is present
    help()
    await exit(0)
  }

  try {
    const camelName = camelCase(subcommand)
    const nettest = nettests[camelName]
    if (argv.help) {
      nettest.help()
      await exit(0)
    } else {
      await run({nettest})
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
