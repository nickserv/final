/* eslint-env mocha */
/* global Command, ValidationError, OptionError, MissingOptionError, InvalidOptionError, Runner, API, CLI */
'use strict'
var _ = require('lodash')
var chai = require('chai')
var final = require('..')
var fs = require('fs')
var http = require('http')
var path = require('path')
var request = require('supertest')
var sinon = require('sinon')
var sinonChai = require('sinon-chai')
var url = require('url')

var expect = chai.expect
chai.use(sinonChai)
Object.assign(global, final)

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

  var command = new Command(commandCore, commandOptions)

  var options = { first: 1, second: 2 }
  var stringOptions = _.mapValues(options, String)

  var invalidOptionError = new InvalidOptionError('invalid')
  var missingOptionError = new MissingOptionError('missing')
  var optionErrors = new Set([invalidOptionError, missingOptionError])
  var validationError = new ValidationError(optionErrors)

  var sandbox
  beforeEach(() => { sandbox = sinon.sandbox.create() })
  afterEach(() => { sandbox.restore() })

  describe('ValidationError', () => {
    describe('constructor', () => {
      it('sets name to ValidationError', () => {
        expect(validationError.name).to.equal('ValidationError')
      })

      it('sets optionErrors', () => {
        expect(validationError.optionErrors).to.equal(optionErrors)
      })
    })

    describe('#mapOptionErrors()', () => {
      it('maps over its optionErrors', () => {
        expect(validationError.mapOptionErrors((e) => e.option)).to.deep.equal(['invalid', 'missing'])
      })
    })

    describe('#toJSON()', () => {
      it('returns a JSON representation of itself, including its optionErrors, as an Object', () => {
        expect(validationError.toJSON()).to.deep.equal({ errors: [{ name: 'InvalidOptionError', option: 'invalid' }, { name: 'MissingOptionError', option: 'missing' }] })
      })
    })

    describe('#toText()', () => {
      it('returns a textual representation of its optionErrors', () => {
        expect(validationError.toText()).to.equal('Error: Invalid option "invalid"\nError: Missing required option "missing"')
      })
    })
  })

  describe('OptionError', () => {
    var optionError = new OptionError('option')

    describe('constructor', () => {
      it('sets name to OptionError', () => {
        expect(optionError.name).to.equal('OptionError')
      })

      it('sets option', () => {
        expect(optionError.option).to.equal('option')
      })
    })

    describe('#toJSON()', () => {
      it('returns a JSON representation of the error\'s name and option as an Object', () => {
        expect(optionError.toJSON()).to.deep.equal({ name: 'OptionError', option: 'option' })
      })
    })
  })

  describe('InvalidOptionError', () => {
    describe('constructor', () => {
      it('sets name to InvalidOptionError', () => {
        expect(invalidOptionError.name).to.equal('InvalidOptionError')
      })
    })

    describe('#toText()', () => {
      it('returns a textual representation of itself', () => {
        expect(invalidOptionError.toText()).to.equal('Error: Invalid option "invalid"')
      })
    })
  })

  describe('MissingOptionError', () => {
    describe('constructor', () => {
      it('sets name to MissingOptionError', () => {
        expect(missingOptionError.name).to.equal('MissingOptionError')
      })
    })

    describe('#toText()', () => {
      it('returns a textual representation of itself', () => {
        expect(missingOptionError.toText()).to.equal('Error: Missing required option "missing"')
      })
    })
  })

  describe('Command', () => {
    var greeting = 'Hello, world!'
    var simpleCommandCore = () => greeting
    var simpleCommand = new Command(simpleCommandCore)

    describe('constructor', () => {
      context('for a command without options', () => {
        it('uses the given core', () => {
          expect(simpleCommand.core).to.equal(simpleCommandCore)
        })

        it('doesn\'t use any options', () => {
          expect(simpleCommand.options).to.be.undefined
        })
      })

      context('for a command with required and optional options', () => {
        it('uses the given core', () => {
          expect(command.core).to.equal(commandCore)
        })

        it('uses the given options', () => {
          expect(command.options).to.equal(commandOptions)
        })
      })
    })

    describe('#createErrors()', () => {
      it('creates errors of the given class for the given options', () => {
        expect(Command.createErrors(OptionError, ['one', 'two'])).to.deep.equal([new OptionError('one'), new OptionError('two')])
      })
    })

    describe('#difference()', () => {
      it('returns the difference of two Sets', () => {
        expect(Command.difference(new Set([1, 2]), new Set([2, 3]))).to.deep.equal(new Set([1]))
      })
    })

    describe('#getOptionNames()', () => {
      it('returns the names of the given options Object', () => {
        expect(Command.getOptionNames(commandOptions)).to.deep.equal(new Set(['first', 'second']))
      })
    })

    describe('#run()', () => {
      context('for a command without options', () => {
        context('given empty options', () => {
          it('returns a String result', () => {
            expect(simpleCommand.run({})).to.equal(greeting)
          })
        })

        context('given any option', () => {
          it('returns a String result', () => {
            expect(simpleCommand.run({ extra: true })).to.equal(greeting)
          })
        })
      })

      context('for a command with required and optional options', () => {
        context('given empty options', () => {
          it('throws a ValidationError', () => {
            expect(() => command.run({})).to.throw(ValidationError)
          })
        })

        context('given only the required option', () => {
          it('returns a String result', () => {
            expect(command.run({ first: 1 })).to.equal('1')
          })
        })

        context('given only the optional option', () => {
          it('throws a ValidationError', () => {
            expect(
              () => command.run({ second: 2 })
            ).to.throw(ValidationError)
          })
        })

        context('given both options', () => {
          it('returns a String result', () => {
            expect(command.run(options)).to.equal('3')
          })
        })

        context('given an invalid option', () => {
          it('throws a ValidationError', () => {
            expect(
              () => command.run({ first: 1, invalid: true })
            ).to.throw(ValidationError)
          })
        })
      })
    })

    describe('#validate()', () => {
      function expectValidationErrors (command, options, expected) {
        var errors = command.validate(new Set(options))
        expect(errors).to.deep.equal(new Set(expected))
      }

      context('for a command with no options', () => {
        context('given no options', () => {
          it('returns no errors', () => {
            expectValidationErrors(simpleCommand, [], [])
          })
        })

        context('given an option', () => {
          it('returns no errors', () => {
            expectValidationErrors(simpleCommand, ['extra'], [])
          })
        })
      })

      context('for a command with a required option and an optional option', () => {
        context('given no options', () => {
          it('returns a MissingOptionError', () => {
            expectValidationErrors(command, [], [
              new MissingOptionError('first')
            ])
          })
        })

        context('given the required option', () => {
          it('returns no errors', () => {
            expectValidationErrors(command, ['first'], [])
          })
        })

        context('given the optional option', () => {
          it('returns a MissingOptionError', () => {
            expectValidationErrors(command, ['second'], [
              new MissingOptionError('first')
            ])
          })
        })

        context('given an invalid option', () => {
          it('returns a MissingOptionError and an InvalidOptionError', () => {
            expectValidationErrors(command, ['invalid'], [
              new MissingOptionError('first'),
              new InvalidOptionError('invalid')
            ])
          })
        })

        context('given the required option and the optional option', () => {
          it('returns no errors', () => {
            expectValidationErrors(command, ['first', 'second'], [])
          })
        })

        context('given the required option and an invalid option', () => {
          it('returns an InvalidOptionError', () => {
            expectValidationErrors(command, ['first', 'invalid'], [
              new InvalidOptionError('invalid')
            ])
          })
        })

        context('given the optional option and an invalid option', () => {
          it('returns a MissingOptionError and an InvalidOptionError', () => {
            expectValidationErrors(command, ['second', 'invalid'], [
              new MissingOptionError('first'),
              new InvalidOptionError('invalid')
            ])
          })
        })

        context('given the required option, the optional option, and an invalid option', () => {
          it('returns an InvalidOptionError', () => {
            expectValidationErrors(command, ['first', 'second', 'invalid'], [
              new InvalidOptionError('invalid')
            ])
          })
        })
      })
    })
  })

  describe('Runner', () => {
    describe('constructor', () => {
      it('uses the given command', () => {
        expect(new Runner(command).command).to.equal(command)
      })
    })
  })

  describe('API', () => {
    var api = new API(command)

    var req = new http.IncomingMessage()
    req.url = 'http://localhost:3000?first=1&second=2'
    var parsedReq = url.parse(req.url)

    after(() => api.close())

    describe('constructor', () => {
      it('creates a server', () => {
        expect(api.server).to.be.an.instanceof(http.Server)
      })
    })

    describe('#callback()', () => {
      it('is a function', () => {
        expect(api.callback).to.be.an.instanceof(Function)
      })

      it('takes a request and a response', () => {
        expect(api.callback).to.have.length(2)
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
        expect(api.callback).to.be.an.instanceof(Function)
      })

      it('takes a request and a response', () => {
        expect(api.callback.length).to.equal(2)
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
        expect(API.options(req)).to.deep.equal(stringOptions)
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
    var cli = new CLI(command)

    before(() => { args = 'node cli.js --first 1 --second 2' })
    beforeEach(() => { process.argv = args.split(' ') })

    describe('#formatOptions()', () => {
      it('formats the given options for usage information', () => {
        expect(CLI.formatOptions(commandOptions)).to.equal('  --first              first number to add\n  --second             second number to add')
      })
    })

    describe('#help()', () => {
      it('returns formatted help text', () => {
        var helpTextPath = path.join(__dirname, 'help.txt')
        var helpText = fs.readFileSync(helpTextPath, 'utf-8').trim()
        expect(cli.help()).to.equal(helpText)
      })
    })

    describe('.options()', () => {
      it('returns options from argv', () => {
        expect(CLI.options()).to.deep.equal(options)
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
        it('runs a cli for the given command that prints a result', stubOutput(function () {
          expect(cli.help).to.not.have.been.called
          expect(console.error).to.not.have.been.called
          expect(console.log).to.have.been.calledOnce
          expect(console.log).to.have.been.calledWithExactly('3')
        }))
      })

      function itDisplaysHelp () {
        it('displays help', stubOutput(function () {
          expect(cli.help).to.have.been.calledOnce
          expect(cli.help).to.have.been.calledWithExactly()
        }))
      }

      context('given invalid options', () => {
        before(() => { args = 'node cli.js --invalid' })

        it('displays validation errors and help', stubOutput(() => {
          var expected = 'Error: Missing required option "first"\n' +
                         'Error: Invalid option "invalid"'
          expect(console.error).to.have.been.calledOnce
          expect(console.error).to.have.been.calledWithExactly(expected)
          expect(console.log).to.have.been.called
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
