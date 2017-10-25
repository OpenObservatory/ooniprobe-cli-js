import { readFileSync, writeFileSync } from 'fs'
import path from 'path'

import level from 'level-party'

import { getOoniDir } from './global-path'

const debug = require('debug')('config.db')

const OONI_DIR = getOoniDir()

const MEASUREMENTS_PATH = path.join(OONI_DIR, 'measurements.ldb')
const REPORTS_PATH = path.join(OONI_DIR, 'reports.ldb')
const STATS_PATH = path.join(OONI_DIR, 'stats.ldb')

const levelOptions = {
  valueEncoding: 'json'
}

let handles = {}
const getDbHandle = (path) => {
  debug(`Getting a DB handle for ${path}`)
  if (handles[path]) {
    return handles[path]
  }
  handles[path] = level(path, levelOptions)
  return handles[path]
}

/* These functions take care of performing operations on the database and then
/* closing it.
 */
const getOperation = (path) => {
  return (key) => {
    return new Promise((resolve, reject) => {
      debug(`getOperation ${key}: ${path}`)
      let db = getDbHandle(path)
      db.get(key, {}, (err, value) => {
        if (err) {
          return reject(err)
        }
        return resolve(value)
      })
    })
  }
}

const putOperation = (path) => {
  return (key, value) => {
      return new Promise((resolve, reject) => {
        debug(`putOperation ${key}: ${path}`)
        let db = getDbHandle(path)
        db.put(key, value, (err, value) => {
          if (err) {
            return reject(err)
          }
          return resolve()
        })
      })
  }
}

// When you use this function, you a responsible for closing the database
// yourself when you are done.
const openOperation = (path) => {
  return () => {
    return getDbHandle(path)
  }
}

export const getMeasurement = getOperation(MEASUREMENTS_PATH)

export const putMeasurement = putOperation(MEASUREMENTS_PATH)

export const openMeasurements = openOperation(MEASUREMENTS_PATH)

export const getReport = getOperation(REPORTS_PATH)

export const putReport = putOperation(REPORTS_PATH)

export const openReports = openOperation(REPORTS_PATH)

export const operations = {
  getMeasurement,
  putMeasurement,
  openMeasurements,
  getReport,
  putReport,
  openReports,
}

export default operations
