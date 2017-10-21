import ora from 'ora'
import { gray } from 'chalk'

const wait = msg => {
  const spinner = ora(gray(msg))
  spinner.color = 'gray'
  spinner.start()

  return (options) => {
    if (!options) {
      options = {symbol: ' '}
    }
    spinner.stopAndPersist(options)
  }
}
export default wait
