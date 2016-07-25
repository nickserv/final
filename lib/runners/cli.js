'use strict'
var _ = require('lodash')
var minimist = require('minimist')
var path = require('path')
var Command = require('../command')
var Runner = require('../runner')

module.exports = class CLI extends Runner {
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
      if (e instanceof Command.ValidationError) {
        console.error(e.toText())
        console.log()
        console.log(this.help())
      } else {
        throw e
      }
    }
  }
}
