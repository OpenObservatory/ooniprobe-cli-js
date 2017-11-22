import path from 'path'

import camelCase from 'camelcase'
import moment from 'moment'

import percentage from '../cli/output/percentage'
import wait from '../cli/output/wait'

import { Measurement } from '../config/db'
import { getOoniDir } from '../config/global-path'

import iso8601 from '../util/iso8601'
import randInt from '../util/randInt'

const debug = require('debug')('nettests.index')

const OONI_DIR = getOoniDir()

const makeReportFile = (name) => {
  return path.join(
    OONI_DIR,
    'measurements',
    'raw',
    `${moment.utc().format(iso8601)}Z-${name}-${randInt(10, 90)}.jsonl`
  )
}

export const makeOoni = () => {
  let dbOperations = [],
      measurements = [],
      progress = null,
      reportId = null,
      reportFile = null,
      measurementName = null,
      uploaded = false,
      localReportId = null,
      isMk = false

  const init = (nt) => {
    // XXX we use duck typing to see if the argument is a measurement Kit
    // nettest. Maybe we should change this.
    debug('Initialising', nt.constructor.name)
    if (measurementName !== null) throw new Error('Init can only be called once')

    if (nt.test && nt.name && nt.setOptions) isMk = true
    if (isMk) {
      measurementName = camelCase(nt.name)
    } else {
      measurementName = camelCase(nt.constructor.name)
    }

    reportFile = makeReportFile(measurementName)
    if (isMk) {
      nt.test.set_options('no_file_report', '0')
      nt.test.set_output_filepath(reportFile)
      nt.on('log', (severity, message) => {
        debug('<'+severity+'>'+message)
        // XXX this a workaround due to a bug in MK
        // I actually also need to know if the report has been created
        if (message.startsWith('Report ID:') && reportId === null) {
          reportId = message.split(':')[1].trim()
          uploaded = true
        }
      })
      nt.on('event', evt => {
        debug('event:', evt)
      })
      nt.on('end', () => {
        debug('ending test')
      })
      nt.on('entry', entry => {
        // XXX This is a bit of a hack
        // When we don't have a reportId with the collector we set the
        // localReportId to the first measurement id.
        // When I have proper ways of handling this:
        // * https://github.com/measurement-kit/measurement-kit/issues/1469
        // * https://github.com/measurement-kit/measurement-kit/issues/1462
        // This should be a bit cleaner
        if (reportId === null) {
          uploaded = false
          reportId = `LOCAL-${entry.id}`
        }
        let measurement = Measurement.build({
          state: 'active',
          reportId: reportId,
          country: entry['probe_cc'],
          asn: entry['probe_asn'],
          ip: entry['ip'],
          measurementId: entry['id'],
          name: measurementName,
          reportFile: reportFile,
          // We append the Z to make moment understand it's UTC
          date: moment(entry['measurement_start_time'] + 'Z').toDate(),
        })
        dbOperations.push(measurement.save())
        measurements.push(measurement)
      })
    }
  }

  const onProgress = (percent, message, persist) => {
    progress && progress()
    progress = wait(`${percentage(percent)}: ${message}`, persist)
  }

  const setSummary = (measurementId, summary) => {
    const msmts = measurements
                    .filter(m => m.measurementId == measurementId)
    if (msmts.length !== 1) {
      throw Error("Could not find measurement with id " + measurementId)
    }
    dbOperations.push(msmts[0].update({
      summary
    }))
  }

  const run = async (runner) => {
    await runner()

    // XXX Here I make the assumption that either it all failed or not.
    // This is a lie.
    for (const measurement of measurements) {
      dbOperations.push(measurement.update({
        state: uploaded ? 'uploaded' : 'done'
      }))
    }

    await Promise.all(dbOperations)
    return measurements
  }

  return {
    init,
    onProgress,
    setSummary,
    run
  }
}

const makeNettestLoader = (nettestName) => {
  return () => {
    return {
      nettest: require('./' + nettestName)
    }
  }
}

const nettests = {
  webConnectivity: makeNettestLoader('web-connectivity'),
  httpInvalidRequestLine: makeNettestLoader('http-invalid-request-line'),
  httpHeaderFieldManipulation: makeNettestLoader('http-header-field-manipulation'),
  ndt: makeNettestLoader('ndt'),

  // Missing wrapper
  dash: makeNettestLoader('dash'),
  facebookMessenger: makeNettestLoader('facebook-messenger'),
  telegram: makeNettestLoader('telegram'),

  // These don't exist in MK
  whatsapp: makeNettestLoader('whatsapp'),
  captivePortal: makeNettestLoader('captive-portal'),
  httpHost: makeNettestLoader('http-host'),
  traceroute: makeNettestLoader('traceroute'),
  bridgeReachability: makeNettestLoader('bridge-reachability'),
  vanillaTor: makeNettestLoader('vanilla-tor'),
  psiphon: makeNettestLoader('psiphon'),
  lantern: makeNettestLoader('lantern'),
  meekFrontendRequests: makeNettestLoader('meek-frontend-requests'),

  // XXX possibly drop these
  /*
  tcpConnect: Base,
  dnsConsistency: Base,
  httpRequests: Base,
  */
}

export const nettestTypes = {
  performance: {
    nettests: [
      nettests.ndt,
      nettests.dash
    ],
    name: 'Performance & Speed',
    shortDescription: 'Tests pertaining to speed & performance of your network.',
    help: 'No help for you',
    makeSummary: (measurements) => {
      return {}
    }
  },
  webCensorship: {
    nettests: [
      nettests.webConnectivity
    ],
    name: 'Web Censorship',
    shortDescription: 'Check if websites are blocked.',
    help: 'No help for you',
    makeSummary: (measurements) => {
      return {}
    }
  },
  middleboxes: {
    nettests: [
      nettests.httpInvalidRequestLine,
      nettests.httpHeaderFieldManipulation
    ],
    name: 'Middleboxes',
    shortDescription: 'Detect the presence of "Middle boxes"',
    help: 'No help for you',
    makeSummary: (measurements) => {
      return {}
    }
  },
  imBlocking: {
    nettests: [
      nettests.whatsapp,
      nettests.facebookMessenger,
      nettests.telegram
    ],
    name: 'IM Blocking',
    shortDescription: 'Check if Instant Messagging apps are blocked.',
    help: 'No help for you',
    makeSummary: (measurements) => {
      return {}
    }
  },
  circumvention: {
    nettests: [
      nettests.vanillaTor,
      nettests.bridgeReachability,
      nettests.meekFrontendRequests,
      nettests.psiphon,
      nettests.lantern
    ],
    name: 'Censorship Circumvention',
    shortDescription: 'Check which censorship circumvention tools work.',
    help: 'No help for you',
    makeSummary: (measurements) => {
      return {}
    }
  }
}

export default nettests
