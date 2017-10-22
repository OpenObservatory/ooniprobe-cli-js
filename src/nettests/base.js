import path from 'path'

import * as fs from 'fs-extra'

import moment from 'moment'
import camelCase from 'camelcase'

import { getOoniDir } from '../config/global-path'
import { openDatabases } from '../config/db'
import iso8601 from '../util/iso8601'

const OONI_DIR = getOoniDir()

const randInt = (min, max) => {
  return Math.floor(Math.random() * max - min) + min
}

class NettestBase {
  /*
  * This is basically an abstract class or interface
  * */

  constructor() {
    this.rawMeasurementsPath = null
    this.db = null
    this.reportId = null
    this.summary = {}

    this.country = 'ZZ'
    this.asn = 'AS0'
    this.ip = '127.0.0.1'
  }

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

  async run(argv) {
    this.rawMeasurementsPath = this.getMeasurementPath()
    await fs.ensureDir(path.dirname(this.rawMeasurementsPath))
    this.db = await openDatabases()
  }

  getMeasurementPath() {
    // Returns a path to where the measurement json should be written to on disk
    // we use the `.jsonl` as that is a more common standard than `.nljson`.
    // see: http://jsonlines.org/
    if (this.rawMeasurementsPath) {
      return this.rawMeasurementsPath
    }
    let filename = `${moment.utc().format(iso8601)}Z-`
    filename += `${camelCase(this.constructor.name)}-${randInt(10, 30)}.jsonl`
    return path.join(OONI_DIR, 'measurements', 'raw', filename)
  }
}
export default NettestBase
