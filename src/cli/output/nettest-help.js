import wrapAnsi from 'wrap-ansi'
import chalk from 'chalk'

import logo from './logo'
import optionPad from './option-pad'

export const nettestHelp = (nettests, nettestName, options) => (`
  ${chalk.blue(logo)} ${chalk.bold('OONI Probe')}

  ${chalk.bold(nettests[nettestName].name)}

  ${wrapAnsi(nettests[nettestName].shortDescription, 40)}

  ${chalk.dim('Usage:')}

    ooni nettest [options] ${nettestName} [options] <url>

  ${chalk.dim('Options:')}

    ${options.map((opt) => optionPad(opt, 80)).join('\n    ')}

`)

export default nettestHelp
