/* eslint-env mocha */
'use strict'
var _ = require('lodash')
var assert = require('assert')
var final = require('..')
var fs = require('fs')
var http = require('http')
var path = require('path')
var request = require('supertest')
var sinon = require('sinon')
var url = require('url')

sinon.assert.expose(assert, { prefix: '' })

describe('final', () => {
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

  var command = new final.Command(commandCore, commandOptions)

  var options = { first: 1, second: 2 }
  var stringOptions = _.mapValues(options, String)

  var invalidOptionError = new final.InvalidOptionError('invalid')
  var missingOptionError = new final.MissingOptionError('missing')
  var optionErrors = new Set([invalidOptionError, missingOptionError])
  var validationError = new final.ValidationError(optionErrors)

  describe('ValidationError', () => {
    describe('constructor', () => {
      it('sets name to ValidationError', () => {
        assert.strictEqual(validationError.name, 'ValidationError')
      })

      it('sets optionErrors', () => {
        assert.strictEqual(validationError.optionErrors, optionErrors)
      })
    })

    describe('#mapOptionErrors()', () => {
      it('maps over its optionErrors', () => {
        assert.deepStrictEqual(validationError.mapOptionErrors((e) => e.option), ['invalid', 'missing'])
      })
    })

    describe('#toJSON()', () => {
      it('returns a JSON representation of itself, including its optionErrors, as an Object', () => {
        assert.deepStrictEqual(validationError.toJSON(), { errors: [{ name: 'InvalidOptionError', option: 'invalid' }, { name: 'MissingOptionError', option: 'missing' }] })
      })
    })

    describe('#toText()', () => {
      it('returns a textual representation of its optionErrors', () => {
        assert.strictEqual(validationError.toText(), 'Error: Invalid option "invalid"\nError: Missing required option "missing"')
      })
    })
  })

  describe('OptionError', () => {
    var optionError = new final.OptionError('option')

    describe('constructor', () => {
      it('sets name to OptionError', () => {
        assert.strictEqual(optionError.name, 'OptionError')
      })

      it('sets option', () => {
        assert.strictEqual(optionError.option, 'option')
      })
    })

    describe('#toJSON()', () => {
      it('returns a JSON representation of the error\'s name and option as an Object', () => {
        assert.deepStrictEqual(optionError.toJSON(), { name: 'OptionError', option: 'option' })
      })
    })
  })

  describe('InvalidOptionError', () => {
    describe('constructor', () => {
      it('sets name to InvalidOptionError', () => {
        assert.strictEqual(invalidOptionError.name, 'InvalidOptionError')
      })
    })

    describe('#toText()', () => {
      it('returns a textual representation of itself', () => {
        assert.strictEqual(invalidOptionError.toText(), 'Error: Invalid option "invalid"')
      })
    })
  })

  describe('MissingOptionError', () => {
    describe('constructor', () => {
      it('sets name to MissingOptionError', () => {
        assert.strictEqual(missingOptionError.name, 'MissingOptionError')
      })
    })

    describe('#toText()', () => {
      it('returns a textual representation of itself', () => {
        assert.strictEqual(missingOptionError.toText(), 'Error: Missing required option "missing"')
      })
    })
  })

  describe('Command', () => {
    var greeting = 'Hello, world!'
    var simpleCommandCore = () => greeting
    var simpleCommand = new final.Command(simpleCommandCore)

    describe('constructor', () => {
      context('for a command without options', () => {
        it('uses the given core', () => {
          assert.strictEqual(simpleCommand.core, simpleCommandCore)
        })

        it('doesn\'t use any options', () => {
          assert.strictEqual(simpleCommand.options, undefined)
        })
      })

      context('for a command with required and optional options', () => {
        it('uses the given core', () => {
          assert.strictEqual(command.core, commandCore)
        })

        it('uses the given options', () => {
          assert.deepStrictEqual(command.options, commandOptions)
        })
      })
    })

    describe('#createErrors()', () => {
      it('creates errors of the given class for the given options', () => {
        assert.deepStrictEqual(final.Command.createErrors(final.OptionError, ['one', 'two']), [new final.OptionError('one'), new final.OptionError('two')])
      })
    })

    describe('#difference()', () => {
      it('returns the difference of two Sets', () => {
        assert.deepStrictEqual(final.Command.difference(new Set([1, 2]), new Set([2, 3])), new Set([1]))
      })
    })

    describe('#getOptionNames()', () => {
      it('returns the names of the given options Object', () => {
        assert.deepStrictEqual(final.Command.getOptionNames(commandOptions), new Set(['first', 'second']))
      })
    })

    describe('#run()', () => {
      context('for a command without options', () => {
        context('given empty options', () => {
          it('returns a String result', () => {
            assert.strictEqual(simpleCommand.run({}), greeting)
          })
        })

        context('given any option', () => {
          it('returns a String result', () => {
            assert.strictEqual(simpleCommand.run({ extra: true }), greeting)
          })
        })
      })

      context('for a command with required and optional options', () => {
        context('given empty options', () => {
          it('throws a ValidationError', () => {
            assert.throws(() => command.run({}), final.ValidationError)
          })
        })

        context('given only the required option', () => {
          it('returns a String result', () => {
            assert.strictEqual(command.run({ first: 1 }), '1')
          })
        })

        context('given only the optional option', () => {
          it('throws a ValidationError', () => {
            assert.throws(() => command.run({ second: 2 }), final.ValidationError)
          })
        })

        context('given both options', () => {
          it('returns a String result', () => {
            assert.strictEqual(command.run(options), '3')
          })
        })

        context('given an invalid option', () => {
          it('throws a ValidationError', () => {
            assert.throws(() => command.run({ first: 1, invalid: true }), final.ValidationError)
          })
        })
      })
    })

    describe('#validate()', () => {
      function assertValidationErrors (command, options, expected) {
        var actual = command.validate(new Set(options))
        assert.deepStrictEqual(actual, new Set(expected))
      }

      context('for a command with no options', () => {
        context('given no options', () => {
          it('returns no errors', () => {
            assertValidationErrors(simpleCommand, [], [])
          })
        })

        context('given an option', () => {
          it('returns no errors', () => {
            assertValidationErrors(simpleCommand, ['extra'], [])
          })
        })
      })

      context('for a command with a required option and an optional option', () => {
        context('given no options', () => {
          it('returns a MissingOptionError', () => {
            assertValidationErrors(command, [], [
              new final.MissingOptionError('first')
            ])
          })
        })

        context('given the required option', () => {
          it('returns no errors', () => {
            assertValidationErrors(command, ['first'], [])
          })
        })

        context('given the optional option', () => {
          it('returns a MissingOptionError', () => {
            assertValidationErrors(command, ['second'], [
              new final.MissingOptionError('first')
            ])
          })
        })

        context('given an invalid option', () => {
          it('returns a MissingOptionError and an InvalidOptionError', () => {
            assertValidationErrors(command, ['invalid'], [
              new final.MissingOptionError('first'),
              new final.InvalidOptionError('invalid')
            ])
          })
        })

        context('given the required option and the optional option', () => {
          it('returns no errors', () => {
            assertValidationErrors(command, ['first', 'second'], [])
          })
        })

        context('given the required option and an invalid option', () => {
          it('returns an InvalidOptionError', () => {
            assertValidationErrors(command, ['first', 'invalid'], [
              new final.InvalidOptionError('invalid')
            ])
          })
        })

        context('given the optional option and an invalid option', () => {
          it('returns a MissingOptionError and an InvalidOptionError', () => {
            assertValidationErrors(command, ['second', 'invalid'], [
              new final.MissingOptionError('first'),
              new final.InvalidOptionError('invalid')
            ])
          })
        })

        context('given the required option, the optional option, and an invalid option', () => {
          it('returns an InvalidOptionError', () => {
            assertValidationErrors(command, ['first', 'second', 'invalid'], [
              new final.InvalidOptionError('invalid')
            ])
          })
        })
      })
    })
  })

  describe('Runner', () => {
    describe('constructor', () => {
      it('uses the given command', () => {
        assert.strictEqual(new final.Runner(command).command, command)
      })
    })
  })

  describe('API', () => {
    var api = new final.API(command)

    var req = new http.IncomingMessage()
    req.url = 'http://localhost:3000?first=1&second=2'
    var parsedReq = url.parse(req.url)

    after(() => api.close())

    describe('constructor', () => {
      it('creates a server', () => {
        assert(api.server instanceof http.Server)
      })
    })

    describe('#server', () => {
      context('given valid options', () => {
        it('responds with a result', (done) => {
          request(api.server)
            .get(parsedReq.path)
            .expect(200, '3\n')
            .expect('content-type', 'text/plain')
            .end(done)
        })
      })

      context('given invalid options', () => {
        it('responds with validation errors', (done) => {
          request(api.server)
            .get('?invalid')
            .expect(403, {
              errors: [
                {
                  name: 'MissingOptionError',
                  option: 'first'
                },
                {
                  name: 'InvalidOptionError',
                  option: 'invalid'
                }
              ]
            })
            .expect('content-type', 'application/json')
            .end(done)
        })
      })
    })

    describe('#callback()', () => {
      it('is a function', () => {
        assert(api.callback instanceof Function)
      })

      it('takes a request and a response', () => {
        assert.strictEqual(api.callback.length, 2)
      })
    })

    describe('#close()', () => {
      it('closes the server', (done) => {
        api.close()

        request(parsedReq.host)
          .get(parsedReq.path)
          .end((err) => {
            err ? done() : done('Error: API server should be closed')
          })
      })
    })

    describe('.options()', () => {
      it('returns options from the given request', () => {
        assert.deepEqual(final.API.options(req), stringOptions)
      })
    })

    describe('#run()', () => {
      it('runs its server for the given command', (done) => {
        api.run()

        request(parsedReq.host)
          .get(parsedReq.path)
          .end(done)
      })
    })
  })

  describe('CLI', () => {
    var args
    var cli = new final.CLI(command)

    before(() => { args = 'node cli.js --first 1 --second 2' })
    beforeEach(() => { process.argv = args.split(' ') })

    describe('#formatOptions()', () => {
      it('formats the given options for usage information', () => {
        assert.strictEqual(final.CLI.formatOptions(commandOptions), '  --first              first number to add\n  --second             second number to add')
      })
    })

    describe('#help()', () => {
      it('returns formatted help text', () => {
        var helpTextPath = path.join(__dirname, 'help.txt')
        var helpText = fs.readFileSync(helpTextPath, 'utf-8').trim()
        assert.strictEqual(cli.help(), helpText)
      })
    })

    describe('.options()', () => {
      it('returns options from argv', () => {
        assert.deepStrictEqual(final.CLI.options(), options)
      })
    })

    describe('#run()', () => {
      // Sets up stubs for tests that would produce console output. This can't
      // be in a beforeEach() hook because the console stubs would hide mocha's
      // command line results.
      function setup (sandbox) {
        sandbox.stub(cli, 'help')
        sandbox.stub(console, 'error')
        sandbox.stub(console, 'log')
        cli.run()
      }

      context('given valid options', () => {
        it('runs a cli for the given command that prints a result', sinon.test(function () {
          setup(this)
          assert.notCalled(cli.help)
          assert.notCalled(console.error)
          assert.calledOnce(console.log)
          assert.calledWithExactly(console.log, '3')
        }))
      })

      function itDisplaysHelp () {
        it('displays help', sinon.test(function () {
          setup(this)
          assert.calledOnce(cli.help)
          assert.calledWithExactly(cli.help)
        }))
      }

      context('given invalid options', () => {
        before(() => { args = 'node cli.js --invalid' })

        it('displays validation errors and help', sinon.test(function () {
          setup(this)
          var expected = 'Error: Missing required option "first"\n' +
                         'Error: Invalid option "invalid"'
          assert.calledOnce(console.error)
          assert.calledWithExactly(console.error, expected)
          assert.called(console.log)
        }))

        itDisplaysHelp()
      })

      context('given the help flag', () => {
        before(() => { args = 'node cli.js --help' })

        itDisplaysHelp()
      })
    })
  })
})
