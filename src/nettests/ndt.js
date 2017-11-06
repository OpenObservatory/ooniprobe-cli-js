import path from 'path'

import * as fs from 'fs-extra'

import chalk from 'chalk'
import moment from 'moment'
import childProcess from 'child_process'
import { spawn } from 'child-process-promise'
import StreamSplitter from 'stream-splitter'

import iso8601 from '../util/iso8601'

import wait from '../cli/output/wait'
import ok from '../cli/output/ok'
import notok from '../cli/output/notok'
import error from '../cli/output/error'

import nettestHelp from '../cli/output/nettest-help'
import rightPad from '../cli/output/right-pad'

import sleep from '../util/sleep'

import { getOoniDir } from '../config/global-path'
import {
  Result,
  Measurement
} from '../config/db'

import NettestBase from './base'

import { Ndt } from 'measurement-kit'
const debug = require('debug')('nettests.ndt')

const toMbit = (kbit) => {
  if (typeof kbit === 'string') {
    kbit = parseFloat(kbit)
  }
  return Math.round(kbit/1024*100)/100
}

class NDT extends NettestBase {
  static get name() {
    return 'NDT'
  }

  static get shortDescription() {
    return 'Measure the speed and performance of your network'
  }

  async run(argv) {
    await super.run(argv)
    let dbOperations = []

    let measurement = Measurement.build({
      name: 'ndt',
      state: 'active',
      reportFile: this.rawMeasurementsPath
    })
    dbOperations.push(measurement.save())

    let persist = true,
        summary = {},
        progressInfo = null,
        uploadMbit = null,
        downloadMbit = null,
        reportId = null

    const ndt = Ndt()

    // XXX this is a hack while I wait for https://github.com/measurement-kit/measurement-kit-node/pull/4
    ndt.test.set_options('no_file_report', '0')
    ndt.test.set_output_filepath(this.rawMeasurementsPath)

    ndt.on('begin', () => {
      progressInfo = wait('0%: starting ndt')
    })
    ndt.on('progress', (percent, message) => {
      persist = !(message.startsWith('upload-speed') || message.startsWith('download-speed'))
      progressInfo && progressInfo(persist)
      percent = Math.floor(percent * 1000)/10
      progressInfo = wait(`${percent}%: ${message}`)
    })
    ndt.on('log', (severity, message) => {
      // XXX this a workaround due to a bug in MK
      if (message.startsWith('Report ID:') && reportId === null) {
        reportId = message.split(':')[1].trim()
        dbOperations.push(measurement.update({
          reportId: reportId
        }))
      }
      debug(`<${severity}> ${message}`)
    })
    ndt.on('entry', entry => {
      const test_keys = entry.test_keys
      if (!measurement.country) {
        // XXX This is a big of a hack
        //reportId = entry['report_id']
        dbOperations.push(measurement.update({
          country: entry['probe_cc'],
          asn: entry['probe_asn'],
          ip: entry['probe_ip'],
          date: moment(entry['measurement_start_time']),
          summary: {
            upload: test_keys.simple['upload'],
            download: test_keys.simple['download'],
            ping: test_keys.simple['ping'],
            maxRtt: test_keys.advanced['max_rtt'],
            avgRtt: test_keys.advanced['avg_rtt'],
            minRtt: test_keys.advanced['min_rtt'],
            mss: test_keys.advanced['mss'],
            outOfOrder: test_keys.advanced['out_of_order'],
            packetLoss: test_keys.advanced['packet_loss'],
            timeouts: test_keys.advanced['timeouts'],
          }
        }))
      }
    })
    ndt.on('event', evt => {
      debug('event:', evt)
    })
    ndt.on('end', () => {
      // XXX is there something better to check if the measurement is
      // uploaded?
      const state = reportId === null ? 'done' : 'uploaded'
      dbOperations.push(measurement.update({
        state: state
      }))
      debug('ending test')
    })

    const printSummary = (summary) => {
      progressInfo && progressInfo()
      console.log('')

      const uploadMbit = toMbit(summary.upload)
      const downloadMbit = toMbit(summary.download)
      const ping = Math.round(summary.ping*10)/10
      const packetLoss = Math.round(summary.packetLoss * 100 * 100)/100
      const outOfOrder = Math.round(summary.outOfOrder * 100 * 100)/100
      const mss = summary.mss
      const timeouts = summary.timeouts
      console.log(`    ${chalk.bold('Download')}: ${chalk.cyan(uploadMbit)} ${chalk.dim('Mbit/s')}`)
      console.log(`      ${chalk.bold('Upload')}: ${chalk.cyan(downloadMbit)} ${chalk.dim('Mbit/s')}`)
      console.log(`        ${chalk.bold('Ping')}: ${chalk.cyan(ping)} ${chalk.dim('ms')} ${chalk.dim('(min/avg/max)')}`)
      console.log(` ${chalk.bold('Packet loss')}: ${chalk.cyan(packetLoss)}`)
      console.log(`${chalk.bold('Out of order')}: ${chalk.cyan(outOfOrder)}`)
      console.log(`         ${chalk.bold('MSS')}: ${chalk.cyan(mss)}`)
      console.log(`    ${chalk.bold('Timeouts')}: ${chalk.cyan(timeouts)}`)
    }

    await ndt.run()
    printSummary(measurement.summary)
    await Promise.all(dbOperations)
    return measurement
  }

  static get help() {
    const meta = {
      name: NDT.name,
      shortDescription: NDT.shortDescription
    }
    return nettestHelp(meta, 'webConnectivity', [
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
export default NDT
