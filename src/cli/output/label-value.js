import chalk from 'chalk'

import stringLength from 'string-length'

export const labelValue = (label, value, options = {}) => {
  const unit = (options.unit && ' ' + options.unit) || ''
  const labelWidth = options.labelWidth || 18
  const pad = options.pad || false
  let leftPadLength = labelWidth - stringLength(label)
  leftPadLength = leftPadLength > 0 ? leftPadLength : 0
  const leftPad = pad ? ' '.repeat(leftPadLength) : ''
  return `${leftPad}${chalk.bold(label)}: ${chalk.cyan(value)}${chalk.dim(unit)}`
}

export default labelValue
