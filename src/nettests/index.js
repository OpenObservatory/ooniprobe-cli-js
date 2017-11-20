import camelCase from 'camelcase'

import percentage from '../cli/output/percentage'
import wait from '../cli/output/wait'

import {
  Result,
  Measurement
} from '../config/db'

import HTTPHeaderFieldManipulation from './http-header-field-manipulation'
import HTTPInvalidRequestLine from './http-invalid-request-line'
import WebConnectivity from './web-connectivity'
import NDT from './ndt'
import Base from './base'

export const makeOoni = () => {
  let dbOperations = [],
      progress = null,
      reportId = null,
      uploaded = false,
      localReportId = null,
      isMk = false

  let measurement = Measurement.build({
    state: 'active'
  })

  const init = (nt) => {
    // XXX we use duck typing to see if the argument is a measurement Kit
    // nettest. Maybe we should change this.
    if (nt.test && nt.name && nt.setOptions) isMk = true

    measurement.name = camelCase(nt.name)
    measurement.reportFile = measurement.makeReportFile()
    dbOperations.push(measurement.save())

    if (isMk) {
      nt.test.set_options('no_file_report', '0')
      nt.test.set_output_filepath(measurement.reportFile)
      nt.on('log', (severity, message) => {
        // XXX this a workaround due to a bug in MK
        // I actually also need to know if the report has been created
        if (message.startsWith('Report ID:') && reportId === null) {
          reportId = message.split(':')[1].trim()
          uploaded = true
        }
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
        if (!measurement.country) {
          dbOperations.push(measurement.update({
            reportId: reportId,
            country: entry['probe_cc'],
            asn: entry['probe_asn'],
            ip: entry['ip'],
            // We append the Z to make moment understand it's UTC
            date: moment(entry['measurement_start_time'] + 'Z').toDate(),
          }))
        }
      })
    }
  }

  const onProgress = (percent, message, persist) => {
    progress && progress()
    progress = wait(`${percentage(percent)}: ${message}`, persist)
  }

  const setSummary = (summary) => {
    dbOperations.push(measurement.update({
      summary
    }))
  }

  const run = async (runner) => {
    await runner()
    dbOperations.push(measurement.update({
      // XXX Here I make the assumption that either it all failed or not.
      // This is wrong.
      state: uploaded ? 'uploaded' : 'done'
    }))
    await Promise.all(dbOperations)
  }

  return {
    init,
    measurement,
    onProgress,
    run
  }
}

const nettests = {
  webConnectivity: WebConnectivity,
  httpInvalidRequestLine: HTTPInvalidRequestLine,
  httpHeaderFieldManipulation: HTTPHeaderFieldManipulation,
  ndt: NDT,

  // Missing wrapper
  dash: Base,
  facebookMessenger: Base,
  telegram: Base,

  // These don't exist in MK
  whatsapp: Base,
  captivePortal: Base,
  httpHost: Base,
  traceroute: Base,
  bridgeReachability: Base,
  vanillaTor: Base,
  psiphon: Base,
  lantern: Base,

  // XXX possibly drop these
  tcpConnect: Base,
  meekFrontendRequests: Base, // this is redundant as it's a subset of webConnectivity
  dnsConsistency: Base,
  httpRequests: Base,
}

export const nettestTypes = {
  performance: {
    nettests: [
      nettests.ndt,
      nettests.dash
    ],
    name: 'Performance & Speed',
    shortDescription: 'Tests pertaining to speed & performance of your network.',
    help: 'No help for you'
  },
  webCensorship: {
    nettests: [
      nettests.webConnectivity
    ],
    name: 'Web Censorship',
    shortDescription: 'Check if websites are blocked.',
    help: 'No help for you'
  },
  middleboxes: {
    nettests: [
      nettests.httpInvalidRequestLine,
      nettests.httpHeaderFieldManipulation
    ],
    name: 'Middleboxes',
    shortDescription: 'Detect the presence of "Middle boxes"',
    help: 'No help for you'
  },
  imBlocking: {
    nettests: [
      nettests.whatsapp,
      nettests.facebookMessenger,
      nettests.telegram
    ],
    name: 'IM Blocking',
    shortDescription: 'Check if Instant Messagging apps are blocked.',
    help: 'No help for you'
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
    help: 'No help for you'
  }
}

export default nettests
