const { Connector, www } = require('../../app')
const restful = require('./restful')
require('./models')
const express = require('express')
const path = require('path')
const cookieParser = require('cookie-parser')
const logger = require('morgan')

const app = express()

app.use(logger('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser())
app.use(express.static(path.join(__dirname, 'public')))

restful.applyRouters(app)

process.env.PORT = 3001
const connector = new Connector('test', 'localhost', restful, app)
www(connector, true)
