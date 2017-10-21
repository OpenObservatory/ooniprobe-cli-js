import HTTPHeaderFieldManipulation from './http-header-field-manipulation'
import HTTPInvalidRequestLine from './http-invalid-request-line'
import WebConnectivity from './web-connectivity'
import NDT from './ndt'

const nettests = {
  webConnectivity: WebConnectivity,
  httpInvalidRequestLine: HTTPInvalidRequestLine,
  httpHeaderFieldManipulation: HTTPHeaderFieldManipulation,
  ndt: NDT
}
export default nettests
