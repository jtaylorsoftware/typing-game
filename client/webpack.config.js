const path = require('path')

module.exports = {
  entry: ['./src/index.js'],
  output: {
    path: path.resolve(__dirname, 'dist'),
    publicPath: '/',
    filename: 'main.js'
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
  }
}
