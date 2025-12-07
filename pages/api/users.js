// api/user.js
const express = require('express')
const app = express()
const cors = require('cors')
const dotenv = require('dotenv')
dotenv.config()

const userService = require('./user-service.js') // relative to project root

// after loading userService
userService.connect().then(() => {
  console.log('Connected to MongoDB (serverless init)')
}).catch(err => {
  console.error('Unable to connect to MongoDB:', err)
})


app.use(express.json())
app.use(cors())

// NOTE: routes are registered without /api/user prefix here
app.post('/register', (req, res) => {
  userService.registerUser(req.body)
    .then(msg => res.json({ message: msg }))
    .catch(msg => res.status(422).json({ message: msg }))
})

app.post('/login', (req, res) => {
  userService.checkUser(req.body)
    .then(user => res.json({ message: "login successful"}))
    .catch(msg => res.status(422).json({ message: msg }))
})

app.get('/favourites', (req, res) => {
  // NOTE: req.user is not implemented yet (no auth). This route will fail if req.user is undefined.
  userService.getFavourites(req.user?._id)
    .then(data => res.json(data))
    .catch(msg => res.status(422).json({ error: msg }))
})

app.put('/favourites/:id', (req, res) => {
  userService.addFavourite(req.user?._id, req.params.id)
    .then(data => res.json(data))
    .catch(msg => res.status(422).json({ error: msg }))
})

app.delete('/favourites/:id', (req, res) => {
  userService.removeFavourite(req.user?._id, req.params.id)
    .then(data => res.json(data))
    .catch(msg => res.status(422).json({ error: msg }))
})

// Export the express app as the handler for Vercel serverless function
module.exports = app
