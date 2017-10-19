import wrapAnsi from 'wrap-ansi'
import chalk from 'chalk'

import header from './header'

import optionPad from './option-pad'
import commandPad from './command-pad'

const commands = [
  {
    name: 'nt | nettest',
    description: 'Run the specified nettest'
  },
  {
    name: 'upload',
    description: 'Upload to a collector the specified measurement collection'
  },
  {
    name: 'listen',
    description: 'Listen to the orchestrator for things to do'
  },
  {
    name: 'ls | list',
    description: 'List all the measurements collected so far'
  },
  {
    name: 'help',
    description: 'Show help information for the specified command'
  },
  {
    name: 'version',
    description: 'Show version information'
  },
]
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

const help = `
  ${header}

  ${chalk.dim('Usage:')}

    ooni [options] <command>

  ${chalk.dim('Commands:')}

    ${commands.map((cmd) => commandPad(cmd)).join('\n    ')}

  ${chalk.dim('Options:')}

    ${options.map((opt) => optionPad(opt)).join('\n    ')}
`
module.exports = help
