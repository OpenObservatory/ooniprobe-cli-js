const cp = require('child_process')
const os = require('os')
const path = require('path')

const pkg = require('pkg')

const nodeTargets = {
  darwin: "node8-macos-x64",
  linux: "node8-linux-x64",
  win32: "node8-win-x64",
}

const nativeModules = {
  darwin: [
    'node_modules/measurement-kit/build/Release/measurement-kit.node',
    'node_modules/sqlite3/lib/binding/node-v57-darwin-x64/node_sqlite3.node'
  ],
  win32: [],
  linux: []
}

const platform = os.platform()

if (!nodeTargets[platform]) {
  console.log('this platform is not supported')
  process.exit(0)
}

console.log('- building packed/ooni for ' + nodeTargets[platform])
pkg.exec([ 'dist/ooni.js', '--target', nodeTargets[platform], '-o', 'packed/ooni' ])
.then(() => {
  nativeModules[platform].forEach(dotNodePath => {
    console.log('- copying ' + dotNodePath)
    cp.spawnSync('cp', [
      dotNodePath,
      'packed/' + path.basename(dotNodePath)
    ], {shell: true})
  })
  process.exit(0)
})
