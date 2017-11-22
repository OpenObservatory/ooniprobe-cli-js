export const makeCli = (log = console.log) => ({
  output: {
    toMbit: require('./output/to-mbit').default,
    labelValue: require('./output/label-value').default,
  },
  log
})

export default makeCli
