import path from 'path'

import chalk from 'chalk'
import childProcess from 'child_process'
import { spawn } from 'child-process-promise'
import StreamSplitter from 'stream-splitter'

import exit from '../util/exit'
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
    const ndt = childProcess.spawn('measurement_kit', args, options)
    const stdoutLines = ndt.stdout.pipe(StreamSplitter('\n'))
    const stderrLines = ndt.stderr.pipe(StreamSplitter('\n'))
    ndt.stdout.on('data', (data) => {
      debug('got', data.toString('utf-8'))
    })
    stdoutLines.on('token', (data) => {
      const s = data.toString('utf-8')
      debug(s)
      /*
      let m
      try {
        m = /(\d+)\%\: (.*)/.exec(s)
      } catch (err) {
        console.log(err)
      }
      if (m) {
        progressInfo && progressInfo()
        progressInfo = wait(`${m[1]}%: ${m[2]}`)
        console.log(s)
      } else {
        console.log(s)
      }
      */
    })

    stderrLines.on('token', ((data) => {
      const s = data.toString('utf-8')
      if (s.startsWith('Your country:')) {
        this.country = s.split(':')[0].trim()
      } else if (s.startsWith('Your public IP address:')) {
        this.ip = s.split(':')[0].trim()
      } else if (s.startsWith('Your ASN:')) { // XXX is this correct?
        this.asn = s.split(':')[0].trim()
      } else if (!this.reportId && s.startsWith('Report ID:')) {
        this.reportId = s.split(':')[0].trim()
        this.db.reports.put(this.reportId, JSON.stringify({
          asn: this.asn,
          country: this.country,
          ip: this.ip,
          testName: 'ndt',
          path: this.rawMeasurementsPath,
        }))
      }
      debug('err', s)
    }).bind(this))

    await new Promise((resolve, reject) => {
      ndt.on('close', () => {
        resolve()
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
