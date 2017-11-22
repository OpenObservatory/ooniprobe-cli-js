
// This function is called to render the summary to the console or GUI when a
// test has finished running.
// It will set either `React` or `Cli` if it's being called from the GUI or CLI
// respectively.
// `measurements` is a list of measurements with their summary (see:
// `src/config/db.js` for details)
export const renderSummary = (measurements, {React, Cli, Components, chalk}) => {
  const summary = measurements[0].summary

  // When this function is called from the Cli the Cli will be set, when it's
  // called from the Desktop app we have React set instead.
  if (Cli) {
    Cli.log(`    ${chalk.bold('Key')}: ${chalk.cyan('value')}`)
  } else if (React) {
    /*
    XXX this is broken currently as it depends on react
    */
  }
}

export const renderHelp = () => {
}

// This is a function called to generate the summary for the test result
// XXX maybe calling `ooni.setSummary` is redundant and takes as arugment the
// `test_keys`
export const makeSummary = (test_keys) => ({
  key: 'value',
})

export const run = ({ooni, argv}) => {
  /*
   * This exported method is basically the `main()` of the test. In here you
   * will create an instance of the test you will be running and wire it
   * up to the OONI Probe scaffoling.
   * Args:
   *  an object containing two attributes: `ooni` and `argv`:
   *  `ooni` is an object that has attributes for interacting with
   *    the OONI Probe testing engine, namely:
   *  * `init` is called with as argument a measurement-kit test only once
   *  * `onProgress` is called to inform OONI Probe that some progress has
   *    happenned and it take 3 arguments `percent`, `message` and `persist` (if
   *    the message should persist on the console)
   *  * `setSummary` is called to set the summary for an entry given an ID
   *  * `run` is called with as argument a function that returns a `Promise`
   */
  const myTest = MyTest()
  ooni.init(myTest)

  myTest.on('begin', () => ooni.onProgress(0.0, 'starting myTest'))
  myTest.on('progress', (percent, message) => {
    const persist = true
    ooni.onProgress(percent, message, persist)
  })
  myTest.on('entry', entry => {
    ooni.setSummary(entry.id, makeSummary(entry.test_keys))
  })
  return ooni.run(myTest.run)
}
