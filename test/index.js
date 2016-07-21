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

Object.assign(global, final)

var should = chai.should()
chai.use(sinonChai)

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
        validationError.name.should.equal('ValidationError')
      })

      it('sets optionErrors', () => {
        validationError.optionErrors.should.equal(optionErrors)
      })
    })

    describe('#mapOptionErrors()', () => {
      it('maps over its optionErrors', () => {
        validationError.mapOptionErrors((e) => e.option).should.deep.equal(['invalid', 'missing'])
      })
    })

    describe('#toJSON()', () => {
      it('returns a JSON representation of itself, including its optionErrors, as an Object', () => {
        validationError.toJSON().should.deep.equal({ errors: [{ name: 'InvalidOptionError', option: 'invalid' }, { name: 'MissingOptionError', option: 'missing' }] })
      })
    })

    describe('#toText()', () => {
      it('returns a textual representation of its optionErrors', () => {
        validationError.toText().should.equal('Error: Invalid option "invalid"\nError: Missing required option "missing"')
      })
    })
  })

  describe('OptionError', () => {
    var optionError = new OptionError('option')

    describe('constructor', () => {
      it('sets name to OptionError', () => {
        optionError.name.should.equal('OptionError')
      })

      it('sets option', () => {
        optionError.option.should.equal('option')
      })
    })

    describe('#toJSON()', () => {
      it('returns a JSON representation of the error\'s name and option as an Object', () => {
        optionError.toJSON().should.deep.equal({ name: 'OptionError', option: 'option' })
      })
    })
  })

  describe('InvalidOptionError', () => {
    describe('constructor', () => {
      it('sets name to InvalidOptionError', () => {
        invalidOptionError.name.should.equal('InvalidOptionError')
      })
    })

    describe('#toText()', () => {
      it('returns a textual representation of itself', () => {
        invalidOptionError.toText().should.equal('Error: Invalid option "invalid"')
      })
    })
  })

  describe('MissingOptionError', () => {
    describe('constructor', () => {
      it('sets name to MissingOptionError', () => {
        missingOptionError.name.should.equal('MissingOptionError')
      })
    })

    describe('#toText()', () => {
      it('returns a textual representation of itself', () => {
        missingOptionError.toText().should.equal('Error: Missing required option "missing"')
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
          simpleCommand.core.should.equal(simpleCommandCore)
        })

        it('doesn\'t use any options', () => {
          should.not.exist(simpleCommand.options)
        })
      })

      context('for a command with required and optional options', () => {
        it('uses the given core', () => {
          command.core.should.equal(commandCore)
        })

        it('uses the given options', () => {
          command.options.should.equal(commandOptions)
        })
      })
    })

    describe('#createErrors()', () => {
      it('creates errors of the given class for the given options', () => {
        Command.createErrors(OptionError, ['one', 'two']).should.deep.equal([new OptionError('one'), new OptionError('two')])
      })
    })

    describe('#difference()', () => {
      it('returns the difference of two Sets', () => {
        Command.difference(new Set([1, 2]), new Set([2, 3])).should.deep.equal(new Set([1]))
      })
    })

    describe('#getOptionNames()', () => {
      it('returns the names of the given options Object', () => {
        Command.getOptionNames(commandOptions).should.deep.equal(new Set(['first', 'second']))
      })
    })

    describe('#run()', () => {
      context('for a command without options', () => {
        context('given empty options', () => {
          it('returns a String result', () => {
            simpleCommand.run({}).should.equal(greeting)
          })
        })

        context('given any option', () => {
          it('returns a String result', () => {
            simpleCommand.run({ extra: true }).should.equal(greeting)
          })
        })
      })

      context('for a command with required and optional options', () => {
        context('given empty options', () => {
          it('throws a ValidationError', () => {
            () => command.run({}).should.throw(ValidationError)
          })
        })

        context('given only the required option', () => {
          it('returns a String result', () => {
            command.run({ first: 1 }).should.equal('1')
          })
        })

        context('given only the optional option', () => {
          it('throws a ValidationError', () => {
            () => command.run({ second: 2 }).should.throw(ValidationError)
          })
        })

        context('given both options', () => {
          it('returns a String result', () => {
            command.run(options).should.equal('3')
          })
        })

        context('given an invalid option', () => {
          it('throws a ValidationError', () => {
            () => command.run({ first: 1, invalid: true }).should.throw(ValidationError)
          })
        })
      })
    })

    describe('#validate()', () => {
      context('for a command with no options', () => {
        context('given no options', () => {
          it('returns no errors', () => {
            simpleCommand.validate(new Set()).should.deep.equal(new Set())
          })
        })

        context('given an option', () => {
          it('returns no errors', () => {
            simpleCommand.validate(new Set(['extra'])).should.deep.equal(new Set())
          })
        })
      })

      context('for a command with a required option and an optional option', () => {
        context('given no options', () => {
          it('returns a MissingOptionError', () => {
            command.validate(new Set()).should.deep.equal(new Set([
              new MissingOptionError('first')
            ]))
          })
        })

        context('given the required option', () => {
          it('returns no errors', () => {
            command.validate(new Set(['first'])).should.deep.equal(new Set())
          })
        })

        context('given the optional option', () => {
          it('returns a MissingOptionError', () => {
            command.validate(new Set(['second'])).should.deep.equal(new Set([
              new MissingOptionError('first')
            ]))
          })
        })

        context('given an invalid option', () => {
          it('returns a MissingOptionError and an InvalidOptionError', () => {
            command.validate(new Set(['invalid'])).should.deep.equal(new Set([
              new MissingOptionError('first'),
              new InvalidOptionError('invalid')
            ]))
          })
        })

        context('given the required option and the optional option', () => {
          it('returns no errors', () => {
            command.validate(new Set(['first', 'second'])).should.deep.equal(new Set())
          })
        })

        context('given the required option and an invalid option', () => {
          it('returns an InvalidOptionError', () => {
            command.validate(new Set(['first', 'invalid'])).should.deep.equal(new Set([
              new InvalidOptionError('invalid')
            ]))
          })
        })

        context('given the optional option and an invalid option', () => {
          it('returns a MissingOptionError and an InvalidOptionError', () => {
            command.validate(new Set(['second', 'invalid'])).should.deep.equal(new Set([
              new MissingOptionError('first'),
              new InvalidOptionError('invalid')
            ]))
          })
        })

        context('given the required option, the optional option, and an invalid option', () => {
          it('returns an InvalidOptionError', () => {
            command.validate(new Set(['first', 'second', 'invalid'])).should.deep.equal(new Set([
              new InvalidOptionError('invalid')
            ]))
          })
        })
      })
    })
  })

  describe('Runner', () => {
    describe('constructor', () => {
      it('uses the given command', () => {
        new Runner(command).command.should.equal(command)
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
        api.server.should.be.an.instanceof(http.Server)
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
        API.options(req).should.deep.equal(stringOptions)
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
        CLI.formatOptions(commandOptions).should.equal('  --first              first number to add\n  --second             second number to add')
      })
    })

    describe('#help()', () => {
      it('returns formatted help text', () => {
        var helpTextPath = path.join(__dirname, 'help.txt')
        var helpText = fs.readFileSync(helpTextPath, 'utf-8').trim()
        cli.help().should.equal(helpText)
      })
    })

    describe('.options()', () => {
      it('returns options from argv', () => {
        CLI.options().should.deep.equal(options)
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
        before(() => { args = 'node cli.js --help' })

        itDisplaysHelp()
      })
    })
  })
})
