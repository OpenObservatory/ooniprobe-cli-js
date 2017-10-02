const { red } = require('chalk')
const { cross } = require('./chars')

const ok = msg => `${red(cross)} ${msg}`

module.exports = ok
