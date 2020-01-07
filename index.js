const express = require('express')
const { check, query, validationResult } = require('express-validator')
const path = require('path')
const helmet = require('helmet')

const { wordsList } = require('./wordslist')

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config()
}

const app = express()

app.use(helmet())

app.get(
  '/api/word',
  [
    query('count', 'Count must be at least 1, maximum 100').isInt({
      min: 1,
      max: 100
    })
  ],
  (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json(errors.array())
    }
    const count = Number.parseInt(req.query.count)
    const indices = randomIndices(count)
    const words = indices.map(i => wordsList[i])
    res.json(words)
  }
)

app.use(express.static('client/dist'))
app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, 'client', 'dist', 'index.html'))
})

app.listen(process.env.PORT, () =>
  console.log(`Server started on port ${process.env.PORT}`)
)

function randomIndices(count) {
  return Array.from({ length: count }, () => randomInt(wordsList.length))
}

function randomInt(max) {
  return Math.floor(Math.random() * max)
}
