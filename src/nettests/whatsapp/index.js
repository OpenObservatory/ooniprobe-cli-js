
import { Whatsapp } from 'measurement-kit'

export const renderSummary = (measurements, {React, Cli, Components, chalk}) => {
  const summary = measurements[0].summary

  // When this function is called from the Cli the Cli will be set, when it's
  // called from the Desktop app we have React set instead.
  if (Cli) {
    if (summary.whatsappEndpointsBlocked === true) {
      Cli.log(Cli.output.notok('Whatapp is blocked'))
    } else {
      Cli.log(Cli.output.ok('Whatapp is not blocked'))
    }

    if (summary.whatsappWebBlocked === true) {
      Cli.log(Cli.output.notok('Whatapp Web is blocked'))
    } else {
      Cli.log(Cli.output.ok('Whatapp Web is not blocked'))
    }

    if (summary.registrationServerBlocked === true) {
      Cli.log(Cli.output.notok('Registration server is blocked'))
    } else {
      Cli.log(Cli.output.ok('Registration server is not blocked'))
    }
  } else if (React) {
    // XXX this is broken currently as it depends on react
  }
}

export const renderHelp = () => {
}

export const makeSummary = ({test_keys}) => ({
  whatsappEndpointsBlocked: test_keys.whatsapp_endpoints_status === 'blocked',
  whatsappWebBlocked: test_keys.whatsapp_web_status === 'blocked',
  registrationServerBlocked: test_keys.registration_server_status === 'blocked'
})

export const run = ({ooni, argv}) => {
  const whatsapp = Whatsapp(ooni.mkOptions)
  ooni.init(whatsapp)

  whatsapp.on('begin', () => ooni.onProgress(0.0, 'starting whatsapp'))
  whatsapp.on('progress', (percent, message) => {
    ooni.onProgress(percent, message)
  })
  return ooni.run(whatsapp.run)
}
