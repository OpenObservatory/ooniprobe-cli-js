import chalk from 'chalk'
import stringLength from 'string-length'
import wrapAnsi from 'wrap-ansi'

import rightPad from './right-pad'

export const commandPad = (cmd) => {
  /*
   * We want the optionWithPadding to look like this:
   * _____________________________________
   * |  | <command> | <description> |
   *   4  +   16      +         60          = 80
   * */
  const padding = rightPad(cmd.name, 16)
  return cmd.name +
          padding +
          wrapAnsi(cmd.description, 60).split('\n').map((line, idx) => {
            // The first line already has padding
            if (idx === 0) {
              return line
            }
            // The other lines need to be padded of the starting 4 columns +
            // the length of the flags + the padding given to the first line of
            // the description
            return padding + ' '.repeat(stringLength(cmd.name) + 4) + line
          }).join('\n')
}

export default commandPad
