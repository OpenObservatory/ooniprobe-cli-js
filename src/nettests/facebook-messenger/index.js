
import { FacebookMessenger } from 'measurement-kit'

export const renderSummary = (measurements, {React, Cli, Components, chalk}) => {
  const summary = measurements[0].summary

  // When this function is called from the Cli the Cli will be set, when it's
  // called from the Desktop app we have React set instead.
  if (Cli) {
    if (summary.facebookDnsBlocking === true) {
      Cli.log(Cli.output.notok('Facebook is blocked via DNS'))
    } else {
      Cli.log(Cli.output.ok('Facebook is not blocked via DNS'))
    }
    if (summary.facebookTcpBlocking === true) {
      Cli.log(Cli.output.notok('Facebook is blocked via TCP'))
    } else {
      Cli.log(Cli.output.ok('Facebook is not blocked via TCP'))
    }
  } else if (React) {
    // XXX this is broken currently as it depends on react
  }
}

export const renderHelp = () => {
}

export const makeSummary = ({test_keys}) => ({
  facebookTcpBlocking: test_keys.facebook_tcp_blocking,
  facebookDnsBlocking: test_keys.facebook_dns_blocking,
  /*
  XXX do we want to expose these too?
  facebook_b_api_dns_consistent
  facebook_b_api_reachable

  facebook_b_graph_dns_consistent
  facebook_b_graph_reachable

  facebook_edge_dns_consistent
  facebook_edge_reachable

  facebook_external_cdn_dns_consistent
  facebook_external_cdn_reachable

  facebook_scontent_cdn_dns_consistent
  facebook_scontent_cdn_reachable

  facebook_star_dns_consistent
  facebook_star_reachable

  facebook_stun_dns_consistent
  facebook_stun_reachable
  */
})

export const run = ({ooni, argv}) => {
  const facebookMessenger = FacebookMessenger(ooni.mkOptions)
  ooni.init(facebookMessenger)

  facebookMessenger.on('begin', () => ooni.onProgress(0.0, 'starting facebook-messenger'))
  facebookMessenger.on('progress', (percent, message) => {
    ooni.onProgress(percent, message)
  })
  return ooni.run(facebookMessenger.run)
}
