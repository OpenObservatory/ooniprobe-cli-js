import * as fs from 'fs-extra'
import path from 'path'

import axios from 'axios'
import zlib from 'zlib'

import wait from '../cli/output/wait'
import { getOoniDir } from './global-path'

const BASE_URL = 'https://github.com/OpenObservatory/ooni-resources/releases/download/'
const LATEST_VERSION = '21'
const GEOIP_ASN_FILENAME = 'maxmind-geoip.GeoIPASNum.dat'
const GEOIP_COUNTRY_FILENAME = 'maxmind-geoip.GeoIP.dat'

const downloadFile = ({url, dst, uncompress}) => {
  return new Promise((resolve, reject) => {
    axios({
      method: 'get',
      url: url,
      responseType: 'stream'
    }).then(response => {
      let outputStream
      if (uncompress) {
        outputStream = zlib.createGunzip()
        outputStream.pipe(fs.createWriteStream(dst))
        response.data.pipe(outputStream)
      } else {
        outputStream = response.data
        outputStream.pipe(fs.createWriteStream(dst))
      }
      outputStream.on('end', () => {
        resolve()
      })
    })
  })
}

export const getGeoipPaths = async () => {
  let progress
  const geoipDir = path.join(getOoniDir(), 'geoip')

  // XXX exception handling
  const geoipDirExists = await fs.pathExists(geoipDir)
  if (!geoipDirExists) {
    await fs.ensureDir(geoipDir)
  }

  const geoipCountryPath = path.join(geoipDir, GEOIP_COUNTRY_FILENAME)
  const geoipCountryExists = await fs.pathExists(geoipCountryPath)
  if (!geoipCountryExists) {
    progress = wait('downloading GeoIP country file')
    await downloadFile({
      url: `${BASE_URL}${LATEST_VERSION}/${GEOIP_COUNTRY_FILENAME}.gz`,
      dst: geoipCountryPath,
      uncompress: true
    })
    progress()
  }

  const geoipAsnPath = path.join(geoipDir, GEOIP_ASN_FILENAME)
  const geoipAsnExists = await fs.pathExists(geoipAsnPath)
  if (!geoipAsnExists) {
    progress = wait('downloading GeoIP ASN file')
    await downloadFile({
      url: `${BASE_URL}${LATEST_VERSION}/${GEOIP_ASN_FILENAME}.gz`,
      dst: geoipAsnPath,
      uncompress: true
    })
    progress()
  }
  return {
    countryPath: geoipCountryPath,
    asnPath: geoipAsnPath,
  }
}
