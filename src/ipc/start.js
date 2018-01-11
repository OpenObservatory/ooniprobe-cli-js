const startIpc = (ipc) => {
  return new Promise((resolve, reject) => {
    ipc.serveNet(() => {
      ip.server.on(
        'something',
        (data, socket) => {
          ipc.log('got message', data)
          ipc.server.emit(
            socket,
            'message',
            data + 'world'
          )
        })
    })
    ipc.server.start()
    resolve()
  })
}
export default startIpc
