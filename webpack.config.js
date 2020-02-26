const path = require('path')
const CopyPlugin = require('copy-webpack-plugin')

module.exports = {
  entry: { index: './src/index.js' },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].bundle.js'
  },
  devServer: {
    contentBase: path.join(__dirname, 'dist'),
    compress: true,
    port: 3000,
    proxy: [
      {
        context: '/api',
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false
      }
    ]
  },
  plugins: [new CopyPlugin([{ from: './src/game/wordlist.js', to: './' }])]
}
