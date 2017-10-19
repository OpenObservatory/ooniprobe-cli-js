#!/usr/bin/env node
import * as fs from 'fs-extra'
import mri from 'mri'

import { blue, bold } from 'chalk'

import commands from './commands'
import logo from './cli/output/logo'
import error from './cli/output/error'
import getDefaultConfig from './get-default-config'
import doOnboarding from './do-onboarding'

import { getOoniDir } from './config/global-path'
import {
  getConfigFilePath,
  readConfigFile,
  writeToConfigFile
} from './config/config-files'

const OONI_DIR = getOoniDir()
const OONI_CONFIG_PATH = getConfigFilePath()

const main = async (argv_) => {
  const argv = mri(argv_, {
    boolean: ['help', 'version', 'verbose'],
    string: [],
    alias: {
      help: 'h'
    }
  })

  let subcommand = argv._[2]

  if (!subcommand && argv.help) {
    console.log(require('./cli/output/help.js'))
    return 0
  }
  if (argv.version || subcommand === 'version') {
    console.log(require('../package').version)
    return 0
  }

  if (!subcommand) {
    console.error(error('No command was specified'))
    console.log(require('./cli/output/help.js'))
    return 1
  }

  // We do it now since we may have to perform a migration too
  let config = await getDefaultConfig()

  let ooniDirExists
  try {
    ooniDirExists = fs.existsSync(OONI_DIR)
  } catch (err) {
    console.error(error('An unexpected error occurred while trying to find the ' +
      `ooni dir "${OONI_DIR}"` + err.message
    ))
  }

  if (!ooniDirExists) {
    try {
      await fs.ensureDir(OONI_DIR)
    } catch (err) {
      console.error(error('An unexpected error occurred while creating the ' +
        `ooni dir in "${OONI_DIR}"` + err.message
      ))
      return 1
    }
  }

  let configExists
  try {
    configExists = fs.existsSync(OONI_CONFIG_PATH)
  } catch (err) {
    console.error(error('An unexpected error occurred while finding ' +
      `ooni config in "${OONI_CONFIG_PATH}"` + err.message
    ))
    return 1
  }

  if (configExists) {
    try {
      config = readConfigFile()
    } catch (err) {
      console.error(error('An unexpected error occurred while reading ' +
        `ooni config file in "${OONI_CONFIG_PATH}"` + err.message
      ))
      return 1
    }
    try {
      config = JSON.parse(config)
    } catch (err) {
      console.error(error('An error occurred parsing ' +
        `ooni config file in "${OONI_CONFIG_PATH}"` + err.message
      ))
      return 1
    }
  } else {
    // If we are in here it either means we migrated (and therefore the config
    // file doesn't exist) or we are a fresh install.
    //
    // In any case we should write the default config file.
    try {
      writeToConfigFile(config)
    } catch (err) {
      console.error(error('An error occurred while writing ' +
        `ooni config file in "${OONI_CONFIG_PATH}"` + err.message
      ))
      return 1
    }
  }

  if (!config._informed_consent) {
    config = await doOnboarding(config)
    try {
      writeToConfigFile(config)
    } catch (err) {
      console.error(error('An error occurred while writing ' +
        `ooni config file in "${OONI_CONFIG_PATH}"` + err.message
      ))
      return 1
    }
  }

  const ctx = {
    argv: argv_
  }

  if (subcommand === 'help' && argv._[3]) {
    subcommand = argv._[3]
    ctx.argv.push('-h')
  }
  else if (subcommand === 'help' && !argv._[3]){
    console.log(require('./cli/output/help.js'))
    return 0
  }

  switch(subcommand) {
    case 'run': {
      return commands.run(ctx)
    }
    case 'nt':
    case 'nettest': {
      return commands.nettest(ctx)
    }
    case 'info': {
      return commands.info(ctx)
    }
    case 'ls':
    case 'list': {
      return commands.list(ctx)
    }
  }
}

main(process.argv)
