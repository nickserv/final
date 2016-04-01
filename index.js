'use strict'
var _ = require('lodash')
var http = require('http')
var minimist = require('minimist')
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
    this.options = options

    // TODO: DRY
    _.each(this.options, (option, name) => {
      if (option.required) {
        if (!this.requiredOptions) this.requiredOptions = []
        this.requiredOptions.push(name)
      } else {
        if (!this.allowedOptions) this.allowedOptions = []
        this.allowedOptions.push(name)
      }
    })
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

class CLI extends Runner {
  help () {
    var helpOptions = { help: { description: 'output usage information' } }
    var extendedOptions = _.extend(helpOptions, this.command.options)

    var options = _.map(extendedOptions, (option, name) => {
      return `  --${_.padEnd(name, 19)}${option.description}`
    }).join('\n')

    return [
      `Usage: ${process.argv[1]} [options]`,
      'Options:',
      options
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

module.exports = { ValidationError, Command, Runner, API, CLI }
