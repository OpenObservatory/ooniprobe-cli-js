import { blue, gray, bold } from 'chalk'
import logo from './cli/output/logo'

import promptList from './cli/input/prompt-list'

export const doOnboarding = async (config) => {
  let advanced = false

  console.log(
  `
  Welcome to ${blue(logo)} ${bold('OONI|Probe')}

  Collect evidence of Internet censorship. Measure the speed and performance of
    your network. Play an active role in increasing transparency of information
    controls around the world.

  By default all network measurement data is uploaded to OONI server for all
    the community to benefit.
  `
  )
  config.privacy.upload_results = await promptList({
    message: 'would you to upload measurements to OONI',
    choices: [
      {
        name: 'yes, sharing is caring',
        value: true,
        short: 'yes'
      },
      {
        name: 'no, I would rather keep them to myself',
        value: false,
        short: 'no'
      },
    ]
  })
  console.log(`
  OONI data is most useful when we are able to know accurately where the tests where run.
    By default we will never share your IP address and limit our collection to
    approximate location information, including your network.
  `)
  advanced = await promptList({
    message: 'would you like to change the defaults',
    choices: [
      {
        name: 'no, network information and approximate location seem reasonable',
        value: false,
        short: 'no'
      },
      {
        name: 'yes, my threat model demands it',
        value: true,
        short: 'yes'
      },
    ]
  })

  if (advanced === true) {
    config.privacy.include_network = await promptList({
      message: 'should we include your network information',
      choices: [
        {
          name: 'yes',
          value: true,
          short: 'yes'
        },
        {
          name: 'no',
          value: false,
          short: 'no'
        }
      ]
    })

    config.privacy.include_ip = await promptList({
      message: 'should we include your IP address',
      choices: [
        {
          name: 'no, I like the default',
          value: false,
          short: 'no'
        },
        {
          name: 'yes, that will make measurements more useful',
          value: true,
          short: 'yes'
        }
      ]
    })

    config.privacy.include_country = await promptList({
      message: 'should we include your country information',
      choices: [
        {
          name: 'yes',
          value: true,
          short: 'yes'
        },
        {
          name: 'no and realise my measurement will not be very useful',
          value: false,
          short: 'no'
        },
      ]
    })
  }
  config._informed_consent = true
  return config
}
export default doOnboarding
