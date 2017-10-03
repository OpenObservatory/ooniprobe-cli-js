import * as fs from 'fs-extra'
import path from 'path'
import { getOoniDir } from '../config/global-path'

const configIpc = async (ipcId) => {
  const ipc = require('node-ipc')
  // XXX we should somewhere do some sanity checks on the permissions of the
  // sockets directory to ensure the world cannot read and write to them.
  const socketRoot = path.join(getOoniDir(), 'sockets')

  await fs.ensureDir(socketRoot)

  ipc.config.id = ipcId || ''+Date.now()
  ipc.config.appspace = 'ooni.'
  ipc.config.retry = 1500
  ipc.config.socketRoot = socketRoot
  // XXX check what this maxConnections does and ensure it's actually secure
  ipc.config.maxConnections = 1
  return ipc
}
export default configIpc
