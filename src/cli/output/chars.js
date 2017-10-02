const chars = {
  // People claim that on windows the normal unicode tick leads to crashes
  tick: process.platform === 'win32' ? '√' : '✔',
  cross: process.platform === 'win32' ? 'X' : '✕'
}

module.exports = chars
