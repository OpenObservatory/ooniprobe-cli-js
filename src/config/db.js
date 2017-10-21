import { readFileSync, writeFileSync } from 'fs'
import path from 'path'

import levelup from 'levelup'
import leveldown from 'leveldown'

import { getOoniDir } from './global-path'

const OONI_DIR = getOoniDir()

const dbFiles = [
  {
    name: 'measurements',
    path: path.join(OONI_DIR, 'measurements.ldb')
  },
  {
    name: 'reports',
    path: path.join(OONI_DIR, 'reports.ldb')
  },
  {
    name: 'stats',
    path: path.join(OONI_DIR, 'stats.ldb')
  }
]

const levelUpOptions = {}

let DB = {}
export const openDatabases = () => {
  return new Promise((resolve, reject) => {
    Promise.all(
      dbFiles.map(d => {
        return new Promise((resolve, reject) => {
          if (DB[d.name]) {
            resolve()
          }
          levelup(leveldown(d.path), levelUpOptions, (err, db) => {
            if (err) {
              reject(err)
            }
            DB[d.name] = db
            resolve()
          })
        })
      })
    ).then(() => resolve(DB))
     .catch((err) => reject(err))
  })
}

export default openDatabases
