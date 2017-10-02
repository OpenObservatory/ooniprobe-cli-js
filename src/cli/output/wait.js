import ora from 'ora'
import { gray } from 'chalk'
import eraseLines from './erase-lines'

const wait = msg => {
  const spinner = ora(gray(msg))
  spinner.color = 'gray'
  spinner.start()

  return () => {
    spinner.stop()
    process.stdout.write(eraseLines(1))
  }
}
export default wait
