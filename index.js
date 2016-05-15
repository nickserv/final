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
    this.requiredOptionNames = Command.getOptionNames(_.pickBy(this.options, 'required'))
    this.optionNames = Command.getOptionNames(this.options)
  }

  static createErrors (ErrorClass, optionNames) {
    return Array.from(optionNames).map((optionName) => new ErrorClass(optionName))
  }

  static difference (a, b) {
    return new Set(Array.from(a).filter((x) => !b.has(x)))
  }

  static getOptionNames (options) {
    return new Set(_.keys(options))
  }

  run (options) {
    var optionErrors = this.validate(Command.getOptionNames(options))
    if (optionErrors.size) throw new ValidationError(optionErrors)

    return String(this.core(_.mapValues(options, String)))
  }

  validate (optionNames) {
    if (!this.options) return new Set([])

    var missingOptions = Command.difference(this.requiredOptionNames, optionNames)
    var invalidOptions = Command.difference(optionNames, this.optionNames)

    return new Set(_.concat(
      Command.createErrors(MissingOptionError, missingOptions),
      Command.createErrors(InvalidOptionError, invalidOptions)
    ))
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
  static formatOptions (options) {
    return _.chain(options)
      .map((option, name) => `  --${_.padEnd(name, 19)}${option.description}`)
      .join('\n')
      .value()
  }

  help () {
    var programName = path.basename(process.argv[1], '.js')
    var helpOption = { help: { description: 'output usage information' } }
    var options = _.extend(helpOption, this.command.options)

    return [
      `Usage: ${programName} [options]`,
      'Options:',
      CLI.formatOptions(options)
    ].join('\n\n')
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
