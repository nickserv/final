var Command = require('./command')
var _ = require('lodash')

exports.commandCore = (options) => {
  return _.parseInt(options.first) + (_.parseInt(options.second) || 0)
}

exports.commandOptions = {
  first: {
    description: 'first number to add',
    required: true
  },
  second: {
    description: 'second number to add'
  }
}

exports.command = new Command(exports.commandCore, exports.commandOptions)
exports.erroringCommand = new Command(() => { throw new Error() })

exports.options = { first: 1, second: 2 }
exports.stringOptions = _.mapValues(exports.options, String)
