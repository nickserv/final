/* global Command, Runner */
var _ = require('lodash')

var commandCore = (options) => {
  return _.parseInt(options.first) + (_.parseInt(options.second) || 0)
}

var commandOptions = {
  first: {
    description: 'first number to add',
    required: true
  },
  second: {
    description: 'second number to add'
  }
}

var command = new Command(commandCore, commandOptions)

describe('Runner', () => {
  describe('constructor', () => {
    context('given a command', () => {
      it('uses the given command', () => {
        var runner = new Runner(command)
        runner.command.should.equal(command)
      })
    })

    context('given a core', () => {
      it('uses a command with the given core', () => {
        var runner = new Runner(commandCore)
        runner.command.should.deep.equal(new Command(commandCore))
      })
    })

    context('given a core and options', () => {
      it('uses a command with the given core and options', () => {
        var runner = new Runner(commandCore, commandOptions)
        runner.command.should.deep.equal(command)
      })
    })
  })
})
