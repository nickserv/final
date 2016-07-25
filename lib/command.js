'use strict'
var _ = require('lodash')
var setHelper = require('./set_helper')

class ValidationError extends Error {
  constructor (optionErrors) {
    super()
    this.name = 'ValidationError'
    this.optionErrors = optionErrors
  }

  mapOptionErrors (callback) {
    return Array.from(setHelper.map(this.optionErrors, callback))
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

module.exports = class Command {
  constructor (core, options) {
    this.core = core
    this.options = options
    this.requiredOptionNames = setHelper.keys(_.pickBy(this.options, 'required'))
    this.optionNames = setHelper.keys(this.options)
  }

  static createErrors (OptionErrorClass, optionNames) {
    return new Set(Array.from(optionNames).map((optionName) => new OptionErrorClass(optionName)))
  }

  run (options) {
    var optionErrors = this.validate(setHelper.keys(options))
    if (optionErrors.size) throw new ValidationError(optionErrors)

    return String(this.core(_.mapValues(options, String)))
  }

  validate (optionNames) {
    if (!this.options) return new Set()

    var missingOptions = setHelper.difference(this.requiredOptionNames, optionNames)
    var invalidOptions = setHelper.difference(optionNames, this.optionNames)

    return setHelper.concat(
      Command.createErrors(MissingOptionError, missingOptions),
      Command.createErrors(InvalidOptionError, invalidOptions)
    )
  }
}

module.exports.ValidationError = ValidationError
module.exports.OptionError = OptionError
module.exports.InvalidOptionError = InvalidOptionError
module.exports.MissingOptionError = MissingOptionError
