import mri from 'mri'
import * as fs from 'fs-extra'

import StreamSplitter from 'stream-splitter'
import prettyjson from 'prettyjson'
import chalk from 'chalk'
import moment from 'moment'

import camelCase from 'camelcase'

import info from '../cli/output/info'
import header from '../cli/output/header'
import error from '../cli/output/error'

import optionPad from '../cli/output/option-pad'
import rightPad from '../cli/output/right-pad'
import labelValue from '../cli/output/label-value'
import icons from '../cli/output/icons'
import pager from '../cli/output/pager'

import exit from '../util/exit'

import nettests from '../nettests'

import {
  getReport
} from '../config/db'

const debug = require('debug')('commands.list')

const help = () => {
  const options = [
      {
        option: '-h, --help',
        description: 'Display usage information'
      }
  ]

  console.log(`
  ${header}

  ${chalk.dim('Usage:')}

    ooni show [options] <report_id | measurement_id>

  ${chalk.dim('Options:')}

    ${options.map((opt) => optionPad(opt, 80)).join('\n    ')}

`)
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

  if ((subcommand === 'list' || subcommand === 'ls' || !subcommand) && argv.help) {
    help()
    await exit(0)
  }
  if (!subcommand) {
    console.log(error('Did not specific a report id or measurement id'))
    help()
    await exit(1)
  }
  let readReport = new Promise((resolve, reject) => {
    getReport(subcommand)
      .then(value => {
        const obj = JSON.parse(value)
        const stream = fs.createReadStream(obj.path).pipe(StreamSplitter("\n"))
        stream.on('token', line => {
          const msmt = JSON.parse(line)
          pager(prettyjson.render(msmt))
            .then(() => resolve())
        })
      })
  })
  await readReport
  await exit(1)
}
export default main
