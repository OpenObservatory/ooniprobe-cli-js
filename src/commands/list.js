import _ from 'lodash'
import mri from 'mri'
import range from 'lodash.range'

import chalk from 'chalk'
import moment from 'moment'

import camelCase from 'camelcase'

import info from '../cli/output/info'
import header from '../cli/output/header'
import error from '../cli/output/error'

import optionPad from '../cli/output/option-pad'
import rightPad from '../cli/output/right-pad'
import labelValue from '../cli/output/label-value'
import testResults from '../cli/output/test-results'
import icons from '../cli/output/icons'
import toMbit from '../cli/output/to-mbit'
import makeCli from '../cli/make-cli'

import exit from '../util/exit'

import { nettestTypes, nettests } from '../nettests'

import {
  Measurement,
  Result
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

    ooni list|ls [ <options> ] [ measurements|msmts ]

  ${chalk.dim('Options:')}

    ${options.map((opt) => optionPad(opt, 80)).join('\n    ')}

`)
}

// Define these as module level variables so we don't have to pass them along
let argv
let subcommand
const listAction = async ctx => {
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

  const listMeasurements = async () => {
    const results = await Measurement.findAndCountAll({group: 'reportId'})

    const out = await testResults(results.rows, async (measurement) => {
      const { nettest } = nettests[measurement.name]()

      let summary = []
      const Cli = makeCli(m => {
        if (summary.length >= 3) return
        summary.push(m)
      })
      // XXX we should figure out how this will work when we have many measurements
      if (measurement.summary) {
        nettest.renderSummary([measurement], {Cli, chalk})
      }
      return {
        name: measurement.name,
        network: measurement.asn,
        asn: measurement.asn,
        country: measurement.country,
        dataUsage: measurement.dataUsage,
        date: measurement.startTime,
        summary: summary
      }
    })
    console.log(out)
  }

  const listResults = async () => {
    const result = await Result.findAndCountAll()

    const out = await testResults(result.rows, async (result) => {
      const measurements = await result.getMeasurements()
      const { renderSummary } = nettestTypes[result.name]

      let summary = []
      const Cli = makeCli(m => {
        summary.push(m)
      })
      renderSummary(result, {Cli, chalk})
      return {
        name: result.name,
        network: measurements[0].asn,
        asn: measurements[0].asn,
        country: measurements[0].country,
        dataUsage: measurements.map(m => m.dataUsage).reduce((a,b) => a += b),
        date: result.startTime,
        summary: summary
      }
    })
    console.log(out)
  }

  if (subcommand === 'measurements' || subcommand === 'msmts') {
    await listMeasurements()
  } else {
    await listResults()
  }
  await exit(1)
}
export default listAction
