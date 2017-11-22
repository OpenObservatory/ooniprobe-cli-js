export const makeCli = () => ({
  output: {
    toMbit: require('./output/to-mbit').default,
  },
  log: console.log
})

export default makeCli
