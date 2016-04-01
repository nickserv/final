var express = require('express')
var http = require('http')
var path = require('path')
var Runner = require('../runner')

module.exports = class App extends Runner {
  constructor (command) {
    super(command)
    this.server = http.createServer(this.createApp())
  }

  close () {
    this.server.close()
  }

  createApp () {
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

    return app
  }

  run () {
    this.server.listen(3000)
  }
}
