
import { HttpInvalidRequestLine } from 'measurement-kit'

export const renderSummary = (measurements, {React, Cli, Components, chalk}) => {
  const summary = measurements[0].summary

  // When this function is called from the Cli the Cli will be set, when it's
  // called from the Desktop app we have React set instead.
  if (Cli) {
    Cli.log(Cli.output.labelValue('Label', uploadMbit, {unit: 'Mbit'}))
  } else if (React) {
    /*
    XXX this is broken currently as it depends on react
    const {
      Container,
      Heading
    } = Components
    return class extends React.Component {
      render() {
        return <Container>
          <Heading h={1}>Results for NDT</Heading>
          {uploadMbit}
        </Container>
      }
    }
    */
  }
}

export const renderHelp = () => {
}

export const makeSummary = ({test_keys}) => ({
})

export const run = ({ooni, argv}) => {
  const httpInvalidRequestLine = HttpInvalidRequestLine(ooni.mkOptions)
  ooni.init(httpInvalidRequestLine)

  httpInvalidRequestLine.on('begin', () => ooni.onProgress(0.0, 'starting http-invalid-request-line'))
  httpInvalidRequestLine.on('progress', (percent, message) => {
    ooni.onProgress(percent, message, persist)
  })
  return ooni.run(httpInvalidRequestLine.run)
}
