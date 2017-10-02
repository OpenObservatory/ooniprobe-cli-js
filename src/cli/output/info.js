const { gray } = require('chalk')
const info = (...msgs) => `${gray('>')} ${msgs.join('\n')}`
module.exports = info
