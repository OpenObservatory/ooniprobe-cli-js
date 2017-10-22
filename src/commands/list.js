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
import labelValue from '../cli/output/label-value'
import icons from '../cli/output/icons'

import exit from '../util/exit'

import nettests from '../nettests'

import {
  getMeasurement,
  putMeasurement,
  openMeasurements,
  getReport,
  putReport,
  openReports,
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

    ooni list [options]

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

  const listReports = () => new Promise((resolve, reject) => {
    try {
      openReports()
        .then(db => {
          const stream = db.createReadStream()
          let reports = []
          stream.on('data', data => {
            debug(`${data.key}=${data.value}`)
            let obj = JSON.parse(data.value)
            obj.reportId = data.key.toString('utf-8')
            reports.push(obj)
          })
          stream.on('close', () => {
            resolve(reports)
          })
          stream.on('end', () => db.close())
        })
        .catch(err => reject(err))
    } catch (err) {
      debug('err', err)
      reject(err)
    }
  })

  const reports = await listReports()
  debug('reports', reports)
  reports.map(r => {
    const fromNow = moment(r.testStartTime).fromNow()
    const testName = nettests[camelCase(r.testName)].name
    const msmtCountUnit = r.measurementCount > 1 ? 'measurements' : 'measurement'
    console.log(`${icons.report}  ${testName} Test results from ${fromNow}`)
    console.log(`   ${chalk.bold(r.measurementCount)} ${chalk.dim(msmtCountUnit)} from ${chalk.cyan(r.asn)} (${chalk.cyan(r.country)})`)
    //console.log(`${labelValue('ASN', r.asn)} ${labelValue('Country', r.country)}`)
    //console.log(`⁝ ${chalk.bold('Summary')}`)
    r.summary.map(s => {
      console.log(labelValue(s.label, s.value, {unit: s.unit}))
    })
    console.log('')
  })
  await exit(1)
}
export default listAction
