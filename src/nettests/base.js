class NettestBase {
  /*
   * This is basically an abstract class or interface
   * */

  get name() {
    return this.constructor.name
  }
  static get name() {
    throw Error('Not implemented')
  }

  get shortDescription() {
    return this.constructor.shortDescription
  }
  static get shortDescription() {
    throw Error('Not implemented')
  }

  get help() {
    return this.constructor.help
  }
  static get help() {
    throw Error('Not implemented')
  }

  async run() {
    throw Error('Not implemented')
  }
}
export default NettestBase
