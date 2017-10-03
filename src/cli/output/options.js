import chalk from 'chalk'
import stringLength from 'string-length'
import wrapAnsi from 'wrap-ansi'

export const rightPad = (s, n) => {
  n -= stringLength(s)
  return ' '.repeat(n > -1 ? n : 0)
}

export const optionWithPadding = (opt) => {
  /*
   * We want the optionWithPadding to look like this:
   * _____________________________________
   * |  | <option flags> | <description> |
   *   4  +   36      +         40          = 80
   * */
  const padding = rightPad(opt.option, 36)
  return opt.option +
          padding +
          wrapAnsi(opt.description, 40).split('\n').map((line, idx) => {
            // The first line already has padding
            if (idx === 0) {
              return line
            }
            // The other lines need to be padded of the starting 4 columns +
            // the length of the flags + the padding given to the first line of
            // the description
            return padding + ' '.repeat(stringLength(opt.option) + 4) + line
          }).join('\n')
}

export const printOptions = (options) => {
  console.log(`
  ${chalk.dim('Options:')}

    ${options.map((opt) => optionWithPadding(opt, 80)).join('\n    ')}
`)
}
export default printOptions
