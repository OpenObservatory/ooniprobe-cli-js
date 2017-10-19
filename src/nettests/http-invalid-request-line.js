import NettestBase from './base'

class HTTPInvalidRequestLine extends NettestBase {
  static get name() {
    return 'HTTP Invalid Request Line'
  }
  static get shortDescription() {
    return 'Check for middle boxes'
  }

  static get help() {
  }

  async run() {
  }
}
export default HTTPInvalidRequestLine
