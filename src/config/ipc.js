let ipcEnabled = false

export const enableIpc = () => {
  if (ipcEnabled === true) {
    throw Error('IPC cannot be enabled twice')
  }
  ipcEnabled = true
  listenForMessages()
}

const listenForMessages = () => {
  process.on('message', m => {
    console.log('got message', m)
  })
}

export const notify = ({key, value}) => {
  if (ipcEnabled === true) {
    process.send({
      key,
      value
    })
  }
}
