import HTTPHeaderFieldManipulation from './http-header-field-manipulation'
import HTTPInvalidRequestLine from './http-invalid-request-line'
import WebConnectivity from './web-connectivity'
import NDT from './ndt'
import Base from './base'

const nettests = {
  webConnectivity: WebConnectivity,
  httpInvalidRequestLine: HTTPInvalidRequestLine,
  httpHeaderFieldManipulation: HTTPHeaderFieldManipulation,
  ndt: NDT,

  // Missing wrapper
  dash: Base,
  facebookMessenger: Base,
  telegram: Base,

  // These don't exist in MK
  whatsapp: Base,
  captivePortal: Base,
  httpHost: Base,
  traceroute: Base,
  bridgeReachability: Base,
  vanillaTor: Base,
  psiphon: Base,
  lantern: Base,

  // XXX possibly drop these
  tcpConnect: Base,
  meekFrontendRequests: Base, // this is redundant as it's a subset of webConnectivity
  dnsConsistency: Base,
  httpRequests: Base,
}

export const nettestTypes = {
  performance: {
    nettests: [
      nettests.ndt,
      nettests.dash
    ],
    name: 'Performance & Speed',
    shortDescription: 'Tests pertaining to speed & performance of your network.',
    help: 'No help for you'
  },
  webCensorship: {
    nettests: [
      nettests.webConnectivity
    ],
    name: 'Web Censorship',
    shortDescription: 'Check if websites are blocked.',
    help: 'No help for you'
  },
  middleboxes: {
    nettests: [
      nettests.httpInvalidRequestLine,
      nettests.httpHeaderFieldManipulation
    ],
    name: 'Middleboxes',
    shortDescription: 'Detect the presence of "Middle boxes"',
    help: 'No help for you'
  },
  imBlocking: {
    nettests: [
      nettests.whatsapp,
      nettests.facebookMessenger,
      nettests.telegram
    ],
    name: 'IM Blocking',
    shortDescription: 'Check if Instant Messagging apps are blocked.',
    help: 'No help for you'
  },
  circumvention: {
    nettests: [
      nettests.vanillaTor,
      nettests.bridgeReachability,
      nettests.meekFrontendRequests,
      nettests.psiphon,
      nettests.lantern
    ],
    name: 'Censorship Circumvention',
    shortDescription: 'Check which censorship circumvention tools work.',
    help: 'No help for you'
  }
}

export default nettests
