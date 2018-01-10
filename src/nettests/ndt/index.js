import { Ndt } from 'measurement-kit'

export const renderSummary = (measurements, {React, Cli, Components, chalk}) => {
  const summary = measurements[0].summary

  const uploadMbit = Cli.output.toMbit(summary.upload)
  const downloadMbit = Cli.output.toMbit(summary.download)
  const ping = Math.round(summary.ping*10)/10
  const packetLoss = Math.round(summary.packetLoss * 100 * 100)/100
  const outOfOrder = Math.round(summary.outOfOrder * 100 * 100)/100

  const mss = summary.mss
  const timeouts = summary.timeouts

  // When this function is called from the Cli the Cli will be set, when it's
  // called from the Desktop app we have React set instead.
  if (Cli) {
    Cli.log(Cli.output.labelValue('Up', uploadMbit, {unit: 'Mbit'}))
    Cli.log(Cli.output.labelValue('Down', uploadMbit, {unit: 'Mbit'}))
    Cli.log(Cli.output.labelValue('Ping', ping, {unit: 'ms'}))
    Cli.log(Cli.output.labelValue('Packet loss', packetLoss))
    Cli.log(Cli.output.labelValue('Out of order', outOfOrder))
    Cli.log(Cli.output.labelValue('MSS', mss))
    Cli.log(Cli.output.labelValue('Timeouts', timeouts))
  } else if (React) {
    // XXX this is broken currently as it depends on react
  }
}

export const renderHelp = () => {
}

export const makeSummary = ({test_keys}) => ({
  upload: test_keys.simple['upload'],
  download: test_keys.simple['download'],
  ping: test_keys.simple['ping'],
  maxRtt: test_keys.advanced['max_rtt'],
  avgRtt: test_keys.advanced['avg_rtt'],
  minRtt: test_keys.advanced['min_rtt'],
  mss: test_keys.advanced['mss'],
  outOfOrder: test_keys.advanced['out_of_order'],
  packetLoss: test_keys.advanced['packet_loss'],
  timeouts: test_keys.advanced['timeouts']
})

export const run = ({ooni, argv}) => {
  const ndt = Ndt(ooni.mkOptions)
  ooni.init(ndt)

  ndt.on('begin', () => ooni.onProgress(0.0, 'starting ndt'))
  ndt.on('progress', (percent, message) => {
    /*
      const persist = (message.startsWith('upload-speed') ||
                     message.startsWith('download-speed'))
    */
    ooni.onProgress(percent, message)
  })
  return ooni.run(ndt.run)
}
