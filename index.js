'use strict'
var _ = require('lodash')
var express = require('express')
var http = require('http')
var minimist = require('minimist')
var path = require('path')
var url = require('url')

class ValidationError extends Error {
  constructor () {
    super()
    this.name = 'ValidationError'
  }
}

class Command {
  constructor (core, options) {
    this.core = core
    Object.assign(this, options)
  }

  static isSubset (subset, superset) {
    return subset.every((item) => superset.indexOf(item) > -1)
  }

  run (options) {
    var optionNames = Object.keys(options)
    if (!this.validate(optionNames)) throw new ValidationError()

    return String(this.core(_.mapValues(options, String)))
  }

  validate (optionNames) {
    var meetsRequiredOptions = !Array.isArray(this.requiredOptions) ||
                                 Command.isSubset(this.requiredOptions, optionNames)
    var meetsAllowedOptions = !Array.isArray(this.allowedOptions) ||
                                Command.isSubset(optionNames, this.allowedOptions.concat(this.requiredOptions))
    return meetsRequiredOptions && meetsAllowedOptions
  }
}

class Runner {
  constructor (command) {
    this.command = command
  }
}

class API extends Runner {
  constructor (command) {
    super(command)
    this.server = http.createServer(this.callback.bind(this))
  }

  callback (req, res) {
    res.setHeader('content-type', 'text/plain')
    res.writeHead(200)
    res.end(`${this.command.run(API.options(req))}\n`)
  }

  close () {
    this.server.close()
  }

  static options (req) {
    return url.parse(req.url, true).query
  }

  run () {
    this.server.listen(3000)
  }
}

class App extends Runner {
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
    app.set('views', path.join(__dirname, 'views'))
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

class CLI extends Runner {
  static options () {
    var args = minimist(process.argv.slice(2))
    return _.omit(args, '_')
  }

  run () {
    console.log(this.command.run(CLI.options()))
  }
}

module.exports = { ValidationError, Command, Runner, API, App, CLI }
