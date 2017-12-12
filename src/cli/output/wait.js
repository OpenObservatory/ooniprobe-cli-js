import ora from 'ora'
import { gray } from 'chalk'

const wait = (msg, persist) => {
  const spinner = ora(gray(msg))
  spinner.color = 'gray'
  spinner.start()

  return (options = {symbol: ' '}) => {
    if (persist) {
      spinner.stopAndPersist(options)
    } else {
      spinner.stop()
    }
  }
}
export default wait
