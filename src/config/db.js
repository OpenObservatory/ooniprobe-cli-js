import { readFileSync, writeFileSync } from 'fs'
import path from 'path'

import levelup from 'levelup'
import leveldown from 'leveldown'

import { getOoniDir } from './global-path'

const debug = require('debug')('config.db')

const OONI_DIR = getOoniDir()

const MEASUREMENTS_PATH = path.join(OONI_DIR, 'measurements.ldb')
const REPORTS_PATH = path.join(OONI_DIR, 'reports.ldb')
const STATS_PATH = path.join(OONI_DIR, 'stats.ldb')

/* These functions take care of performing operations on the database and then
/* closing it.
 */
const getOperation = (path) => {
  return (key, options = {}) => {
    return new Promise((resolve, reject) => {
      levelup(leveldown(path), options, (err, db) => {
        if (err) {
          reject(err)
          return
        }
        db.get(key)
          .then(value => {
            db.close()
              .then(() => resolve(value))
              .catch(err => reject(err))
          })
          .catch(err => reject(err)) // XXX do I need to close it in this case?
      })
    })
  }
}

const putOperation = (path) => {
  return (key, value, options = {}) => {
    debug('putOperation calling', key, value)
    return new Promise((resolve, reject) => {
      levelup(leveldown(path), options, (err, db) => {
        if (err) {
          debug('putOperation: error', err)
          reject(err)
          return
        }
        db.put(key, value)
          .then(() => {
            db.close()
              .then(() => resolve())
              .catch(err => reject(err))
          })
          .catch(err => reject(err)) // XXX do I need to close it in this case?
      })
    })
  }
}

// When you use this function, you a responsible for closing the database
// yourself when you are done.
const openOperation = (path) => {
  return () => {
    debug('openOperation calling on ', path)
    return new Promise((resolve, reject) => {
      debug('putOperation calling')
      levelup(leveldown(path), {}, (err, db) => {
        if (err) {
          reject(err)
          return
        }
        resolve(db)
      })
    })
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
