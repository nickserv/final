'use strict'
var _ = require('lodash')
var http = require('http')
var minimist = require('minimist')
var path = require('path')
var url = require('url')

class ValidationError extends Error {
  constructor (optionErrors) {
    super()
    this.name = 'ValidationError'
    this.optionErrors = optionErrors
  }
}

class OptionError extends Error {
  constructor (option) {
    super()
    this.name = 'OptionError'
    this.option = option
  }
}

class InvalidOptionError extends OptionError {
  constructor (option) {
    super(option)
    this.name = 'InvalidOptionError'
  }
}

class MissingOptionError extends OptionError {
  constructor (option) {
    super(option)
    this.name = 'MissingOptionError'
  }
}

class Command {
  constructor (core, options) {
    this.core = core
    this.options = options
    this.requiredOptionNames = _.keys(_.pickBy(this.options, 'required'))
    this.optionNames = _.keys(this.options)
  }

  static createErrors (errors) {
    function errorForEachOption (ErrorClass, optionNames) {
      return _.map(optionNames, (optionName) => new ErrorClass(optionName))
    }

    return _.flatten(_.map(errors, (item) => errorForEachOption(item.Error, item.options)))
  }

  run (options) {
    var optionErrors = this.validate(Object.keys(options))
    if (optionErrors.length) throw new ValidationError(optionErrors)

    return String(this.core(_.mapValues(options, String)))
  }

  validate (optionNames) {
    if (!this.options) return []

    return Command.createErrors([
      {
        Error: MissingOptionError,
        options: _.difference(this.requiredOptionNames, optionNames)
      },
      {
        Error: InvalidOptionError,
        options: _.difference(optionNames, this.optionNames)
      }
    ])
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

class CLI extends Runner {
  help () {
    if (this.helpText) {
      return this.helpText
    } else {
      var helpOptions = { help: { description: 'output usage information' } }
      var extendedOptions = _.extend(helpOptions, this.command.options)

      var options = _.map(extendedOptions, (option, name) => {
        return `  --${_.padEnd(name, 19)}${option.description}`
      }).join('\n')

      this.helpText = [
        `Usage: ${path.basename(process.argv[1], '.js')} [options]`,
        'Options:',
        options
      ].join('\n\n')

      return this.helpText
    }
  }

  static options () {
    var args = minimist(process.argv.slice(2))
    return _.omit(args, '_')
  }

  run () {
    var options = CLI.options()
    console.log(options.help ? this.help() : this.command.run(options))
  }
}

module.exports = { InvalidOptionError, MissingOptionError, ValidationError, Command, Runner, API, CLI }
