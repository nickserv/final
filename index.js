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

  mapOptionErrors (callback) {
    return Array.from(this.optionErrors.values()).map(callback)
  }

  toJSON () {
    return {
      errors: this.mapOptionErrors((e) => e.toJSON())
    }
  }

  toText () {
    return this.mapOptionErrors((e) => e.toText()).join('\n')
  }
}

class OptionError extends Error {
  constructor (option) {
    super()
    this.name = 'OptionError'
    this.option = option
  }

  toJSON () {
    return {
      name: this.name,
      option: this.option
    }
  }
}

class InvalidOptionError extends OptionError {
  constructor (option) {
    super(option)
    this.name = 'InvalidOptionError'
  }

  toText () {
    return `Error: Invalid option "${this.option}"`
  }
}

class MissingOptionError extends OptionError {
  constructor (option) {
    super(option)
    this.name = 'MissingOptionError'
  }

  toText () {
    return `Error: Missing required option "${this.option}"`
  }
}

class Command {
  constructor (core, options) {
    this.core = core
    this.options = options
    this.requiredOptionNames = Command.getOptionNames(_.pickBy(this.options, 'required'))
    this.optionNames = Command.getOptionNames(this.options)
  }

  static createErrors (OptionErrorClass, optionNames) {
    return Array.from(optionNames).map((optionName) => new OptionErrorClass(optionName))
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
  constructor (commandOrCore, options) {
    if (commandOrCore instanceof Command) {
      this.command = commandOrCore
    } else {
      this.command = new Command(commandOrCore, options)
    }
  }
}

class API extends Runner {
  constructor (command) {
    super(command)

    this.server = http.createServer((req, res) => {
      try {
        var body = `${this.command.run(API.options(req))}\n`
        res.setHeader('content-type', 'text/plain')
        res.writeHead(200)
        res.end(body)
      } catch (e) {
        if (e instanceof ValidationError) {
          body = JSON.stringify(e.toJSON())
          res.setHeader('content-type', 'application/json')
          res.writeHead(403)
        } else {
          throw e
        }
      } finally {
        res.end(body)
      }
    })
  }

  close () {
    this.server.close()
  }

  static options (req) {
    var query = url.parse(req.url, true).query

    // Force the result to extend Object.prototype for testing
    return Object.assign({}, query)
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
    var options = this.command.options
    var required = _.pickBy(options, (option) => option.required)
    var optional = _.pickBy(options, (option) => !option.required)
    optional = _.extend(helpOption, optional)

    return [
      `Usage: ${programName} <required> [optional]`,
      'Required:',
      CLI.formatOptions(required),
      'Optional:',
      CLI.formatOptions(optional)
    ].join('\n\n')
  }

  static options () {
    var args = minimist(process.argv.slice(2))
    return _.omit(args, '_')
  }

  run () {
    var options = CLI.options()
    try {
      console.log(options.help ? this.help() : this.command.run(options))
    } catch (e) {
      if (e instanceof ValidationError) {
        console.error(e.toText())
        console.log()
        console.log(this.help())
      } else {
        throw e
      }
    }
  }
}

module.exports = { OptionError, InvalidOptionError, MissingOptionError, ValidationError, Command, Runner, API, CLI }
