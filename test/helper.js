/* global Command */
var _ = require('lodash')
var chai = require('chai')
var final = require('..')
var sinonChai = require('sinon-chai')

Object.assign(global, final)

global.should = chai.should()
chai.use(sinonChai)

global.commandCore = (options) => {
  return _.parseInt(options.first) + (_.parseInt(options.second) || 0)
}

global.commandOptions = {
  first: {
    description: 'first number to add',
    required: true
  },
  second: {
    description: 'second number to add'
  }
}

global.command = new Command(global.commandCore, global.commandOptions)
global.erroringCommand = new Command(() => { throw new Error() })

global.options = { first: 1, second: 2 }
global.stringOptions = _.mapValues(global.options, String)
