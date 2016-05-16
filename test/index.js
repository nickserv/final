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

  describe('Command', () => {
    var greeting = 'Hello, world!'
    var simpleCommandCore = () => greeting
    var simpleCommand = new final.Command(simpleCommandCore)

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
            expect(() => command.run({})).to.throw(final.ValidationError)
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
            ).to.throw(final.ValidationError)
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
            ).to.throw(final.ValidationError)
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
              new final.MissingOptionError('first')
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
              new final.MissingOptionError('first')
            ])
          })
        })

        context('given an invalid option', () => {
          it('returns a MissingOptionError and an InvalidOptionError', () => {
            expectValidationErrors(command, ['invalid'], [
              new final.MissingOptionError('first'),
              new final.InvalidOptionError('invalid')
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
              new final.InvalidOptionError('invalid')
            ])
          })
        })

        context('given the optional option and an invalid option', () => {
          it('returns a MissingOptionError and an InvalidOptionError', () => {
            expectValidationErrors(command, ['second', 'invalid'], [
              new final.MissingOptionError('first'),
              new final.InvalidOptionError('invalid')
            ])
          })
        })

        context('given the required option, the optional option, and an invalid option', () => {
          it('returns an InvalidOptionError', () => {
            expectValidationErrors(command, ['first', 'second', 'invalid'], [
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
        expect(new final.Runner(command).command).to.equal(command)
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
        expect(final.API.options(req)).to.deep.equal(stringOptions)
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

    describe('#help()', () => {
      it('returns formatted help text', () => {
        var helpTextPath = path.join(__dirname, 'help.txt')
        var helpText = fs.readFileSync(helpTextPath, 'utf-8').trim()
        expect(cli.help()).to.equal(helpText)
      })
    })

    describe('.options()', () => {
      it('returns options from argv', () => {
        expect(final.CLI.options()).to.deep.equal(options)
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
          expect(cli.help).to.not.have.been.called
          expect(console.error).to.not.have.been.called
          expect(console.log).to.have.been.calledOnce
          expect(console.log).to.have.been.calledWithExactly('3')
        }))
      })

      function itDisplaysHelp () {
        it('displays help', sinon.test(function () {
          setup(this)
          expect(cli.help).to.have.been.calledOnce
          expect(cli.help).to.have.been.calledWithExactly()
        }))
      }

      context('given invalid options', () => {
        before(() => { args = 'node cli.js --invalid' })

        it('displays validation errors and help', sinon.test(function () {
          setup(this)
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
