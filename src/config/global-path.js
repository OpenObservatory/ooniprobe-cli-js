const { homedir } = require('os')
const path = require('path')

const getOoniDir = () => {
  const customPath = null

  if (!customPath) {
    return path.join(homedir(), '.ooni')
  }
  return path.resolve(customPath)
}
