import path from 'path'

import * as fs from 'fs-extra'

import chalk from 'chalk'
import moment from 'moment'
import childProcess from 'child_process'
import { spawn } from 'child-process-promise'
import StreamSplitter from 'stream-splitter'

import exit from '../util/exit'
import iso8601 from '../util/iso8601'

import wait from '../cli/output/wait'
import ok from '../cli/output/ok'
import notok from '../cli/output/notok'
import error from '../cli/output/error'

import nettestHelp from '../cli/output/nettest-help'
import rightPad from '../cli/output/right-pad'

import sleep from '../util/sleep'

import { getOoniDir } from '../config/global-path'

import NettestBase from './base'

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
    const db = this.db

    const args = [
      '-o',
      this.rawMeasurementsPath,
      'ndt'
    ]
    const options = {
      cwd: path.join(getOoniDir(), 'resources'),
      stdio: 'pipe'
    }
    let progressInfo = wait('starting'),
        persist = true
    const ndt = childProcess.spawn('measurement_kit', args, options)
    const stdoutLines = ndt.stdout.pipe(StreamSplitter('\n'))
    const stderrLines = ndt.stderr.pipe(StreamSplitter('\n'))
    stdoutLines.on('token', (data) => {
      const s = data.toString('utf-8')
      debug(s)
      let m
      try {
        m = /(\d+)\%\: (.*)/.exec(s)
      } catch (err) {
        console.log(err)
      }
      if (m) {
        progressInfo && progressInfo(persist)
        progressInfo = wait(`${m[1]}%: ${m[2]}`)
        persist = true
        if (m[2].startsWith('upload-speed') || m[2].startsWith('download-speed')) {
          persist = false
        }
      } else {
        m = /(.+?)\: (.*)/.exec(s)
        if (m && m.length === 3) {
          this.summary[m[1]] = m[2]
        }
      }
    })

    stderrLines.on('token', ((data) => {
      const s = data.toString('utf-8')
      if (s.startsWith('Your country:')) {
        this.country = s.split(':')[1].trim()
      } else if (s.startsWith('Your public IP address:')) {
        this.ip = s.split(':')[1].trim()
      } else if (s.startsWith('Your ASN:')) { // XXX is this correct?
        this.asn = s.split(':')[1].trim()
      } else if (!this.reportId && s.startsWith('Report ID:')) {
        this.reportId = s.split(':')[1].trim()
        db.reports.put(this.reportId, JSON.stringify({
          asn: this.asn,
          country: this.country,
          ip: this.ip,
          testName: 'ndt',
          path: this.rawMeasurementsPath,
        }))
      }
      debug('err', s)
    }).bind(this))

    const printSummary = () => {
      progressInfo && progressInfo()
      console.log('')

      const summary = this.summary
      const speedRe = /\d+\.?\d*/
      const uploadMbit = toMbit(speedRe.exec(summary['Upload speed'])[0])
      const downloadMbit = toMbit(speedRe.exec(summary['Download speed'])[0])
      const ping = /(.*?) ms/.exec(summary['RTT (min/avg/max)'])[1]
      console.log(`    ${chalk.bold('Download')}: ${chalk.cyan(uploadMbit)} ${chalk.dim('Mbit/s')}`)
      console.log(`      ${chalk.bold('Upload')}: ${chalk.cyan(downloadMbit)} ${chalk.dim('Mbit/s')}`)
      console.log(`        ${chalk.bold('Ping')}: ${chalk.cyan(ping)} ${chalk.dim('ms')} ${chalk.dim('(min/avg/max)')}`)
      console.log(` ${chalk.bold('Packet loss')}: ${chalk.cyan(summary['Packet loss rate'])}`)
      console.log(`${chalk.bold('Out of order')}: ${chalk.cyan(summary['Out of order'])}`)
      console.log(`         ${chalk.bold('MSS')}: ${chalk.cyan(summary['MSS'])}`)
      console.log(`    ${chalk.bold('Timeouts')}: ${chalk.cyan(summary['Timeouts'])}`)
    }

    const updateDb = (() => {
      const reportId = this.reportId
      return new Promise((resolve, reject) => {
        db.reports.get(reportId)
          .then(value => {
            const obj = JSON.parse(value)
            let promises = [],
                testStartTime,
                measurementCount = 0,
                reportOk = true,
                summary = {}
            const stream = fs.createReadStream(obj.path).pipe(StreamSplitter("\n"))
            stream.on('token', line => {
              const msmt = JSON.parse(line)

              let ok = true
              let msmtKey = msmt.report_id
              if (msmt.input) {
                msmtKey += `?${msmt.input}`
              }
              let measurementStartTime = moment(msmt.measurement_start_time).format(iso8601)+'Z'

              testStartTime = moment(msmt.test_start_time).format(iso8601)+'Z'
              measurementCount += 1
              reportOk = true
              summary = [
                {
                  label: 'Download',
                  value: toMbit(msmt.test_keys.simple.download),
                  unit: 'Mbit/s'
                },
                {
                  label: 'Upload',
                  value: toMbit(msmt.test_keys.simple.upload),
                  unit: 'Mbit/s'
                },
                {
                  label: 'Ping',
                  value: msmt.test_keys.simple.ping,
                  unit: 'ms'
                }
              ]
              promises.push(db.measurements.put(msmtKey, JSON.stringify({
                id: msmt.id,
                measurementCount,
                summary,
                measurementStartTime,
                ok
              })))
            })
            stream.on('done', () => {
              const report = Object.assign(obj, {
                testStartTime,
                summary,
                measurementCount,
                ok
              })
              Promise.all(promises)
                .then(() => {
                  db.reports.put(reportId, JSON.stringify(report))
                })
                .catch(err => reject(err))
            })
          })
      })
    }).bind(this)

    await new Promise((resolve, reject) => {
      ndt.on('close', () => {
        printSummary()
        updateDb()
          .then(() => resolve())
          .catch(err => reject(err))
      })
    })
    await exit(0)
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
