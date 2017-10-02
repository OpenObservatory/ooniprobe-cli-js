export default code => new Promise(() => {
  // workaround for node bug flushing stdout asynchronously
  // see: https://github.com/nodejs/node/issues/6456
  setTimeout(() => process.exit(code || 0), 100)
})
