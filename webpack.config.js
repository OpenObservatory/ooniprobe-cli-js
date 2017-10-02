const nodeExternals = require('webpack-node-externals')
const FlowBabelWebpackPlugin = require('flow-babel-webpack-plugin')

module.exports = {
	entry: './src/ooni.js',
  target: 'node',
  externals: [nodeExternals()],
  node: {
    __dirname: false
  },
  output: {
    filename: 'dist/ooni.js'
  },
  module: {
    loaders: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loaders: ['shebang-loader', 'babel-loader']
      }
    ]
  },
  plugins: [
    new FlowBabelWebpackPlugin(),
  ]
}
