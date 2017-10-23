import chalk from 'chalk'

import ansiEscapes from 'ansi-escapes'
import windowSize from 'window-size'
import keypress from 'keypress'



export const pager = (text) => {
  // XXX we only support shortish texts
  return new Promise((resolve, reject) => {
    class Pager {
      constructor(lines) {
        this.pos = 0
        this.lines = lines
        this.isEnd = false
      }
      up(count = 1) {
        this.isEnd = false
        if (this.pos - count > 0) {
          this.pos -= count
        } else {
          this.pos = 0
        }
        this.printPage()
      }
      down(count = 1) {
        this.isEnd = false
        if (this.lines.length >= this.pos + count + windowSize.height) {
          this.pos += count
        } else {
          this.pos = this.lines.length - windowSize.height
          this.isEnd = true
        }
        this.printPage()
      }

      printStatus() {
        let s = this.isEnd ? 'END' : ':'
        process.stdout.write(ansiEscapes.eraseLines(1))
        process.stdout.write(s)
        process.stdout.write(ansiEscapes.cursorTo(1, windowSize.height))
      }
      printPage() {
        process.stdout.write(ansiEscapes.eraseScreen)
        this.lines
          .filter((line, idx) => (idx >= this.pos && idx < (windowSize.height + this.pos - 1)))
          .map(line => console.log(line))
        this.printStatus()
      }
    }
    keypress(process.stdin)
    const p = new Pager(text.split('\n'))
    p.printPage()

    process.stdin.on('keypress', (ch, key) => {
      if (!key) {
        return
      }
      switch (key.name) {
        case 'j':
        case 'down':
        case 'return':
        case 'space': {
          p.down()
          break
        }
        case 'k':
        case 'up': {
          p.up()
          break
        }
        case 'q': {
          resolve(true)
          break
        }
        case 'n': {
          resolve(false)
          break
        }
        case 'u':
        case 'pageup': {
          if (key.name === 'u' && !key.ctrl) {
            break
          }
          p.up(Math.floor(windowSize.height/2))
          break
        }
        case 'd':
        case 'pagedown': {
          if (key.name === 'd' && !key.ctrl) {
            break
          }
          p.down(Math.floor(windowSize.height/2))
          break
        }
      }
      if (key && key.ctrl && key.name == 'c') {
        process.stdin.pause()
      }
    })
    process.stdin.setRawMode(true)
    process.stdin.resume()
  })
}
export default pager
