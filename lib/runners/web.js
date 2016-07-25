var express = require('express')
var http = require('http')
var path = require('path')
var ServableRunner = require('./servable_runner')

module.exports = class Web extends ServableRunner {
  constructor (command) {
    super(command)

    var app = express()

    // configuration
    app.set('views', path.join(__dirname, '../views'))
    app.set('view engine', 'ejs')

    // gui
    app.get('/', (req, res, next) => {
      res.render('index', {
        requiredOptions: this.command.requiredOptions,
        title: this.command.constructor.name
      })
    })

    // result
    app.get('/result', (req, res, next) => {
      res.render('result', {
        output: this.command.run(req.query),
        title: this.command.constructor.name
      })
    })

    this.server = new http.Server(app)
  }
}
