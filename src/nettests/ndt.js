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
  getMeasurement,
  putMeasurement,
  getReport,
  putReport,
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
    const args = [
      '-o',
      this.rawMeasurementsPath,
      'ndt'
    ]
    const options = {
      cwd: path.join(getOoniDir(), 'resources'),
      stdio: 'pipe'
    }

    let metadata = {
          testName: 'ndt',
          path: this.rawMeasurementsPath
        },
        persist = true,
        dbOperations = [],
        measurementCount = 0,
        summary = {},
        progressInfo = null,
        uploadMbit = null,
        downloadMbit = null,
        ping = null,
        reportId = null

    const ndt = Ndt()
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
      if (message.startsWith('Report ID:')) {
        reportId = message.split(':')[1].trim()
      }
      debug(`<${severity}> ${message}`)
    })
    ndt.on('entry', entry => {
      const test_keys = entry.test_keys
      const msmtSummary = [
        {
          label: 'Download',
          value: toMbit(test_keys.simple.download),
          unit: 'Mbit/s'
        },
        {
          label: 'Upload',
          value: toMbit(test_keys.simple.upload),
          unit: 'Mbit/s'
        },
        {
          label: 'Ping',
          value: test_keys.simple.ping,
          unit: 'ms'
        }
      ]

      if (!metadata.country) {
        //reportId = entry['report_id']
        metadata['country'] = entry['probe_cc']
        metadata['asn'] = entry['probe_asn']
        metadata['ip'] = entry['probe_ip']
        metadata['testStartTime'] = moment(entry.test_start_time).format(iso8601)+'Z'
        metadata['summary'] = msmtSummary
        dbOperations.push(putReport(reportId, metadata))
      }

      // XXX extra sanity checks?
      summary = {
        upload: test_keys.simple.upload,
        download: test_keys.simple.download,
        ping: test_keys.simple.ping,
        max_rtt: test_keys.advanced.max_rtt,
        avg_rtt: test_keys.advanced.avg_rtt,
        min_rtt: test_keys.advanced.min_rtt,
        mss: test_keys.advanced.mss,
        out_of_order: test_keys.advanced.out_of_order,
        packet_loss: test_keys.advanced.packet_loss,
        timeouts: test_keys.advanced.timeouts,
      }
      measurementCount += 1
      // This dataformat doesn't actually work
      dbOperations.push(putMeasurement(reportId, {
        id: entry.id,
        measurementCount,
        summary: msmtSummary,
        ok: true,
        measurementStartTime: moment(entry.measurement_start_time).format(iso8601)+'Z'
      }))
      // XXX I probably have to wait on the above promise
      dbOperations.push(getReport(reportId).then(obj => {
        const report = Object.assign(obj, {
          summary,
          measurementCount,
          ok
        })
        return putReport(reportId, report)
      }))
      debug('entry:', entry)
    })
    ndt.on('event', evt => {
        debug('event:', evt)
    })
    ndt.on('end', () => {
        debug('ending test')
    })

    const printSummary = (summary) => {
      progressInfo && progressInfo()
      console.log('')

      const uploadMbit = toMbit(summary.upload)
      const downloadMbit = toMbit(summary.download)
      const ping = Math.round(summary.ping*10)/10
      const packetLoss = Math.round(summary.packet_loss * 100 * 100)/100
      const outOfOrder = Math.round(summary.out_of_order * 100 * 100)/100
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
    printSummary(summary)
    await Promise.all(dbOperations)
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
