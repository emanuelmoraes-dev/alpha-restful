const { Connector, www } = require('./app')
const restful = require('./restful')
require('./models')
const debug = require('debug')('restful-developer:server')
const express = require('express')
const path = require('path')
const cookieParser = require('cookie-parser')
const logger = require('morgan')

const routesIndex = require('./routes')

const app = express()

app.use(logger('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser())
app.use(express.static(path.join(__dirname, 'public')))

app.use('/', routesIndex)

restful.applyRouters(app)

app.use(function(err, req, res, next) {
    err.status = err.status || 500
    err.message = err.message || 'Um Erro Inesperado Ocorreu!'
    err.messageDev = err.messageDev || err.message

    console.error(err)
    
    res.status(err.status).send({ message: err.message, messageDev: err.messageDev })
})

const connector = new Connector('test', 'localhost', restful, app)
www(connector, debug)
