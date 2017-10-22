import ora from 'ora'
import { gray } from 'chalk'

const wait = msg => {
  const spinner = ora(gray(msg))
  spinner.color = 'gray'
  spinner.start()

  return (persist = true, options = {symbol: ' '}) => {
    if (persist) {
      spinner.stopAndPersist(options)
    } else {
      spinner.stop()
    }
  }
}
export default wait
