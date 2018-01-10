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
    `${moment.utc().format(iso8601)}Z-${name}-${randInt(10, 90)}.jsonl`
  )
}

export const makeOoni = (loader, geoip) => {
  let dbOperations = [],
      measurements = [],
      mkOptions = {},
      progress = null,
      reportId = null,
      reportFile = null,
      measurementName = camelCase(loader.meta.name),
      uploaded = false,
      localReportId = null,
      isMk = false

  reportFile = makeReportFile(measurementName)
  mkOptions = {
    outputPath: reportFile
  }
  const init = (nt) => {
    // XXX we use duck typing to see if the argument is a measurement Kit
    // nettest. Maybe we should change this.
    debug('Initialising', nt.constructor.name)

    if (nt.test && nt.name && nt.setOptions) isMk = true

    if (isMk) {
      nt.test.set_options('no_file_report', '0')
      nt.test.set_output_filepath(reportFile)
      nt.setOptions({
        geoipCountryPath: geoip.countryPath,
        geoipAsnPath: geoip.asnPath
      })
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
          startTime: moment(entry['measurement_start_time'] + 'Z').toDate(),
          summary: loader.nettest.makeSummary(entry)
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
  }

  const run = async (runner) => {
    await runner()

    // XXX Here I make the assumption that either it all failed or not.
    // This is a lie.
    for (const measurement of measurements) {
      dbOperations.push(measurement.update({
        state: uploaded ? 'uploaded' : 'done',
        endTime: moment().utc().toDate(),
        dataUsage: 1024**2*randInt(1, 20) // XXX we currently fill this with some random data
      }))
    }

    await Promise.all(dbOperations)
    progress && progress()
    return measurements
  }

  return {
    init,
    onProgress,
    setSummary,
    mkOptions,
    run
  }
}

const makeNettestLoader = (nettestName) => {
  return () => {
    return {
      nettest: require('./' + nettestName),
      // XXX maybe populate this from the package.json
      meta: {
        name: nettestName
      }
    }
  }
}

export const nettests = {
  webConnectivity: makeNettestLoader('web-connectivity'),
  httpInvalidRequestLine: makeNettestLoader('http-invalid-request-line'),
  httpHeaderFieldManipulation: makeNettestLoader('http-header-field-manipulation'),
  ndt: makeNettestLoader('ndt'),
  dash: makeNettestLoader('dash'),
  facebookMessenger: makeNettestLoader('facebook-messenger'),
  telegram: makeNettestLoader('telegram'),
  whatsapp: makeNettestLoader('whatsapp'),

  // These don't exist in MK
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
      //nettests.dash
    ],
    name: 'Performance & Speed',
    shortDescription: 'Tests pertaining to speed & performance of your network.',
    help: 'No help for you',
    makeSummary: (measurements) => {
      return {
        upload: measurements[0].summary.upload,
        download: measurements[0].summary.download,
        ping: measurements[0].summary.ping
      }
    },
    renderSummary: (result, {Cli, chalk}) => {
      const summary = result.summary
      const uploadMbit = Cli.output.toMbit(summary.upload)
      const downloadMbit = Cli.output.toMbit(summary.download)
      const ping = Math.round(summary.ping*10)/10

      Cli.log(Cli.output.labelValue('Up', uploadMbit, {unit: 'Mbit'}))
      Cli.log(Cli.output.labelValue('Down', uploadMbit, {unit: 'Mbit'}))
      Cli.log(Cli.output.labelValue('Ping', ping, {unit: 'ms'}))
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
    },
    renderSummary: (measurement, {Cli, chalk}) => {}
  },
  middleboxes: {
    nettests: [
      nettests.httpInvalidRequestLine,
      nettests.httpHeaderFieldManipulation
    ],
    name: 'Middle Boxes',
    shortDescription: 'Detect the presence of Middle Boxes',
    help: 'No help for you',
    makeSummary: (measurements) => {
      return {
        foundMiddlebox: true
      }
    },
    renderSummary: (measurement, {Cli, chalk}) => {}
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
      return {
        facebookMessengerBlocked: true,
        whatsappBlocked: true,
        telegramBlocked: true,
      }
    },
    renderSummary: (measurement, {Cli, chalk}) => {
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
    },
    renderSummary: (measurement, {Cli, chalk}) => {}
  }
}

export default nettests
