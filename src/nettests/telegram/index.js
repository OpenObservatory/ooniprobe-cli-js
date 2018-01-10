
import { Telegram } from 'measurement-kit'

export const renderSummary = (measurements, {React, Cli, Components, chalk}) => {
  const summary = measurements[0].summary

  // When this function is called from the Cli the Cli will be set, when it's
  // called from the Desktop app we have React set instead.
  if (Cli) {

    if (summary.telegramHttpBlocked === true) {
      Cli.log(Cli.output.notok('Telegram via HTTP is blocked'))
    } else {
      Cli.log(Cli.output.ok('Telegram via HTTP is not blocked'))
    }

    if (summary.telegramTcpBlocked === true) {
      Cli.log(Cli.output.notok('Telegram via TCP is blocked'))
    } else {
      Cli.log(Cli.output.ok('Telegram via TCP is not blocked'))
    }

    if (summary.telegramWebBlocked === true) {
      Cli.log(Cli.output.notok('Telegram Web is blocked'))
    } else {
      Cli.log(Cli.output.ok('Telegram Web is not blocked'))
    }
  } else if (React) {
    // XXX this is broken currently as it depends on react
  }
}

export const renderHelp = () => {
}

export const makeSummary = ({test_keys}) => ({
  telegramWebBlocked: test_keys.telegram_web_status === 'blocked',
  telegramHttpBlocked: test_keys.telegram_http_blocking,
  telegramTcpBlocked: test_keys.telegram_tcp_blocking,
})

export const run = ({ooni, argv}) => {
  const telegram = Telegram(ooni.mkOptions)
  ooni.init(telegram)

  telegram.on('begin', () => ooni.onProgress(0.0, 'starting telegram'))
  telegram.on('progress', (percent, message) => {
    ooni.onProgress(percent, message)
  })
  return ooni.run(telegram.run)
}
