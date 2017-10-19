import HTTPHeaderFieldManipulation from './http-header-field-manipulation'
import HTTPInvalidRequestLine from './http-invalid-request-line'
import WebConnectivity from './web-connectivity'

const nettests = {
  webConnectivity: WebConnectivity,
  httpInvalidRequestLine: HTTPInvalidRequestLine,
  httpHeaderFieldManipulation: HTTPHeaderFieldManipulation
}
export default nettests
