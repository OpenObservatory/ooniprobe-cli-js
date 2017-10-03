import * as fs from 'fs-extra'
import path from 'path'
import { homedir } from 'os'
import promptList from './cli/input/prompt-list'

import info from './cli/output/info'
import success from './cli/output/success'
import error from './cli/output/error'
import ok from './cli/output/ok'

import exit from './util/exit'

const getDefaultConfig = async () => {
  let err

  const config = {
    '_': 'This is your OONI Probe config file. See https://ooni.io/help/ooniprobe-cli for help',
    'auto_update': true,
    'privacy': {
      'include_ip': false,
      'include_network': true,
      'include_country': true,
      'upload_results': true,
      'send_crash_reports': true
    },
    '_informed_consent': false
  }

  const oldOoniHomePath = path.join(homedir(), '.ooni')
  const oldOoniHomeExists = await fs.pathExists(oldOoniHomePath)
  if (oldOoniHomeExists === true) {
    // XXX do we also want to attempt to migrate the configuration over?
    // I would say no, as it's error prone and we may end up with an
    // inconsistent configuration (also we would have to add extra deps to
    // parse YAML)
    console.log(info(`We found an existing OONI Probe installation in ${oldOoniHomePath}`))
    const answer = await promptList({
      message: 'should we',
      choices: [
        {
          name: 'delete it and start fresh (recommended)',
          value: 'delete',
          short: 'delete it'
        },
        {
          name: 'keep it and move it to ~/.ooni-legacy',
          value: 'keep',
          short: 'keep it'
        },
      ]
    })
    if (answer === 'keep') {
      const legacyPath = path.join(homedir(),
                                   '.ooni-legacy')
      err = await fs.move(oldOoniHomePath, legacyPath)
      if (err) {
        console.error(error(`Failed to rename ${oldOoniHomePath} to ${legacyPath}`))
        console.error(error(err))
        await exit(1)
        return
      }
      console.log(success(`Renamed ${oldOoniHomePath} to ${legacyPath}`))
    } else {
      err = await fs.remove(oldOoniHomePath)
      if (err) {
        console.error(error(`Failed to delete ${oldOoniHomePath}`))
        console.error(error(err))
        await exit(1)
        return
      }
      console.log(success(`Deleted ${oldOoniHomePath}`))
    }
  }

  return config
}

export default getDefaultConfig
