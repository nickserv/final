/* global command, commandOptions, erroringCommand, options, runners */
var fs = require('fs')
var path = require('path')
var sinon = require('sinon')

describe('runners.CLI', () => {
  var args
  var cli = new runners.CLI(command)

  before(() => { args = 'node cli.js --first 1 --second 2' })
  beforeEach(() => { process.argv = args.split(' ') })

  var sandbox
  beforeEach(() => { sandbox = sinon.sandbox.create() })
  afterEach(() => { sandbox.restore() })

  describe('#formatOptions()', () => {
    it('formats the given options for usage information', () => {
      runners.CLI.formatOptions(commandOptions).should.equal('  --first              first number to add\n  --second             second number to add')
    })
  })

  describe('#help()', () => {
    it('returns formatted help text', () => {
      var helpTextPath = path.join(__dirname, '../data/help.txt')
      var helpText = fs.readFileSync(helpTextPath, 'utf-8').trim()
      cli.help().should.equal(helpText)
    })
  })

  describe('.options()', () => {
    it('returns options from argv', () => {
      runners.CLI.options().should.deep.equal(options)
    })
  })

  describe('#run()', () => {
    beforeEach(() => { sandbox.spy(cli, 'help') })

    // Sets up stubs for tests that would produce console output. This can't
    // be in a beforeEach() hook because the console stubs would hide mocha's
    // command line results.
    function stubOutput (callback) {
      return () => {
        sandbox.stub(console, 'error')
        sandbox.stub(console, 'log')
        cli.run()
        callback()
      }
    }

    context('given valid options', () => {
      it('runs a cli for the given command that prints a result', stubOutput(() => {
        cli.help.should.not.have.been.called
        console.error.should.not.have.been.called
        console.log.should.have.been.calledOnce
        console.log.should.have.been.calledWithExactly('3')
      }))
    })

    function itDisplaysHelp () {
      it('displays help', stubOutput(() => {
        cli.help.should.have.been.calledOnce
        cli.help.should.have.been.calledWithExactly()
      }))
    }

    context('given invalid options', () => {
      before(() => { args = 'node cli.js --invalid' })

      it('displays validation errors and help', stubOutput(() => {
        var expected = 'Error: Missing required option "first"\n' +
                       'Error: Invalid option "invalid"'
        console.error.should.have.been.calledOnce
        console.error.should.have.been.calledWithExactly(expected)
        console.log.should.have.been.called
      }))

      itDisplaysHelp()
    })

    context('given the help flag', () => {
      // Note: we need to reset the args after this test or all following
      // tests will only display help, regardless of options given

      var argsBackup

      before(() => {
        argsBackup = args
        args = 'node cli.js --help'
      })

      after(() => { args = argsBackup })

      itDisplaysHelp()
    })

    context('with a failing command', () => {
      it('lets the command throw an error', () => {
        (() => new runners.CLI(erroringCommand).run()).should.throw(Error)
      })
    })
  })
})
