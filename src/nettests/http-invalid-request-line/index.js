
import { HttpInvalidRequestLine } from 'measurement-kit'

export const renderSummary = (measurements, {React, Cli, Components, chalk}) => {
  const summary = measurements[0].summary

  // When this function is called from the Cli the Cli will be set, when it's
  // called from the Desktop app we have React set instead.
  if (Cli) {
    if (summary.foundMiddlebox === true) {
      Cli.log(Cli.output.notok('Detected the presence of a Middle Box'))
    } else {
      Cli.log(Cli.output.ok('No Middle Box detected'))
    }
  } else if (React) {
    // XXX this is broken currently as it depends on react
  }
}

export const renderHelp = () => {
}

export const makeSummary = ({test_keys}) => ({
  foundMiddlebox: test_keys.tampering
})

export const run = ({ooni, argv}) => {
  const httpInvalidRequestLine = HttpInvalidRequestLine(ooni.mkOptions)
  ooni.init(httpInvalidRequestLine)

  httpInvalidRequestLine.on('begin', () => ooni.onProgress(0.0, 'starting http-invalid-request-line'))
  httpInvalidRequestLine.on('progress', (percent, message) => {
    ooni.onProgress(percent, message)
  })
  return ooni.run(httpInvalidRequestLine.run)
}
