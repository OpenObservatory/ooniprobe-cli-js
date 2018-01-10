export const makeCli = (log = console.log) => ({
  output: {
    toMbit: require('./output/to-mbit').default,
    labelValue: require('./output/label-value').default,
    ok: require('./output/ok'),
    notok: require('./output/notok'),
  },
  log
})

export default makeCli
