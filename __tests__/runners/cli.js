var CLI = require('../../lib/runners/cli')
var fs = require('fs')
var helper = require('../../lib/helper')
var path = require('path')

global.console.error = jest.fn()
global.console.log = jest.fn()

describe('runners.CLI', () => {
  var args
  var cli = new CLI(helper.command)

  beforeAll(() => { args = 'node cli.js --first 1 --second 2' })
  beforeEach(() => { process.argv = args.split(' ') })

  describe('#formatOptions()', () => {
    test('formats the given options for usage information', () => {
      expect(CLI.formatOptions(helper.commandOptions)).toBe(
        '  --first              first number to add\n  --second             second number to add'
      )
    })
  })

  describe('#help()', () => {
    test('returns formatted help text', () => {
      var helpTextPath = path.join(__dirname, '../data/help.txt')
      var helpText = fs.readFileSync(helpTextPath, 'utf-8').trim()
      expect(cli.help()).toBe(helpText)
    })
  })

  describe('.options()', () => {
    test('returns options from argv', () => {
      expect(CLI.options()).toEqual(helper.options)
    })
  })

  describe('#run()', () => {
    beforeEach(() => {
      cli.help = jest.fn()
    })

    describe('given valid options', () => {
      test('runs a cli for the given command that prints a result', () => {
        cli.run()
        expect(cli.help).not.toHaveBeenCalled()
        expect(console.error).not.toHaveBeenCalled()
        expect(console.log).toHaveBeenCalledWith('3')
      }
      )
    })

    function itDisplaysHelp () {
      test('displays help', () => {
        cli.run()
        expect(cli.help).toHaveBeenCalledWith()
      })
    }

    describe('given invalid options', () => {
      beforeAll(() => { args = 'node cli.js --invalid' })

      test('displays validation errors and help', () => {
        cli.run()
        var expected = 'Error: Missing required option "first"\n' +
                       'Error: Invalid option "invalid"'
        expect(console.error).toHaveBeenCalledWith(expected)
        expect(console.log).toHaveBeenCalled()
      })

      itDisplaysHelp()
    })

    describe('given the help flag', () => {
      // Note: we need to reset the args after this test or all following
      // tests will only display help, regardless of options given

      var argsBackup

      beforeAll(() => {
        argsBackup = args
        args = 'node cli.js --help'
      })

      afterAll(() => { args = argsBackup })

      itDisplaysHelp()
    })

    describe('with a failing command', () => {
      test('lets the command throw an error', () => {
        expect(() => new CLI(helper.erroringCommand).run()).toThrowError(Error)
      })
    })
  })
})
