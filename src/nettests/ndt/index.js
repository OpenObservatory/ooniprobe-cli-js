exports.renderRunSummary = (measurements, {React, Cli, Components, chalk}) => {
  const summary = measurements[0].summary

  const uploadMbit = Util.toMbit(summary.upload)
  const downloadMbit = Util.toMbit(summary.download)
  const ping = Math.round(summary.ping*10)/10
  const packetLoss = Math.round(summary.packetLoss * 100 * 100)/100
  const outOfOrder = Math.round(summary.outOfOrder * 100 * 100)/100

  const mss = summary.mss
  const timeouts = summary.timeouts

  // When this function is called from the Cli the Cli will be set, when it's
  // called from the Desktop app we have React set instead.
  if (Cli) {
    Cli.log(`    ${chalk.bold('Download')}: ${chalk.cyan(uploadMbit)} ${chalk.dim('Mbit/s')}`)
    Cli.log(`      ${chalk.bold('Upload')}: ${chalk.cyan(downloadMbit)} ${chalk.dim('Mbit/s')}`)
    Cli.log(`        ${chalk.bold('Ping')}: ${chalk.cyan(ping)} ${chalk.dim('ms')} ${chalk.dim('(min/avg/max)')}`)
    Cli.log(` ${chalk.bold('Packet loss')}: ${chalk.cyan(packetLoss)}`)
    Cli.log(`${chalk.bold('Out of order')}: ${chalk.cyan(outOfOrder)}`)
    Cli.log(`         ${chalk.bold('MSS')}: ${chalk.cyan(mss)}`)
    Cli.log(`    ${chalk.bold('Timeouts')}: ${chalk.cyan(timeouts)}`)
  } else if (React) {
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
  }
}

const makeSummary = (test_keys) => {
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
}

exports.run = ({ooni, argv}) => {
  const ndt = Ndt()
  ooni.init(ndt)

  ndt.on('begin', () => ooni.onProgress(0.0, 'starting ndt'))
  ndt.on('progress', (percent, message) => {
    persist = !(message.startsWith('upload-speed') ||
                message.startsWith('download-speed'))
    ooni.onProgress(percent, message, persist)
  })

  ndt.on('log', (severity, message) => {
    debug(`<${severity}> ${message}`)
  })
  ndt.on('entry', entry => {
    ooni.setSummary(entry.id, makeSummary(entry.test_keys))
  })
  ndt.on('event', evt => {
    debug('event:', evt)
  })
  ndt.on('end', () => {
    debug('ending test')
  })

  return ooni.run(ndt.run)
}
