const path = require('path')
const CopyPlugin = require('copy-webpack-plugin')

module.exports = {
  entry: { index: './src/index.js' },
  target: ['web', 'es5'],
  output: {
    path: path.join(__dirname, 'public', 'js'),
    filename: '[name].bundle.js',
  },
  devServer: {
    static: [
      {
        directory: path.join(__dirname, 'public'),
      },
      {
        directory: path.join(__dirname, 'public', 'js'),
      },
      {
        directory: path.join(__dirname, 'src', 'game', 'wordlist.js'),
        publicPath: '/js/wordlist.js',
      },
      {
        directory: path.join(__dirname, 'public', 'css'),
      },
    ],
    compress: true,
    port: 3000,
  },
  plugins: [
    new CopyPlugin({
      patterns: [{ from: './src/game/wordlist.js' }],
    }),
  ],
}
