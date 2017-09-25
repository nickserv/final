var Command = require('../lib/command')
var Runner = require('../lib/runner')
var helper = require('../lib/helper')

describe('Runner', () => {
  describe('constructor', () => {
    describe('given a command', () => {
      test('uses the given command', () => {
        var runner = new Runner(helper.command)
        expect(runner.command).toBe(helper.command)
      })
    })

    describe('given a core', () => {
      test('uses a command with the given core', () => {
        var runner = new Runner(helper.commandCore)
        expect(runner.command).toEqual(new Command(helper.commandCore))
      })
    })

    describe('given a core and options', () => {
      test('uses a command with the given core and options', () => {
        var runner = new Runner(helper.commandCore, helper.commandOptions)
        expect(runner.command).toEqual(helper.command)
      })
    })
  })
})
