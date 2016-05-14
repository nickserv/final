'use strict'
var _ = require('lodash')
var assert = require('chai').assert
var final = require('..')
var http = require('http')
var sinon = require('sinon')

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
          assert.deepEqual(command.options, commandOptions)
        })
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
      context('for a command with no options', () => {
        context('given no options', () => {
          it('returns no errors', () => {
            assert.deepEqual(simpleCommand.validate(new Set([])), new Set([]))
          })
        })

        context('given an option', () => {
          it('returns no errors', () => {
            assert.deepEqual(simpleCommand.validate(new Set(['extra'])), new Set([]))
          })
        })
      })

      context('for a command with a required option and an optional option', () => {
        context('given no options', () => {
          it('returns a MissingOptionError', () => {
            assert.deepEqual(command.validate(new Set([])), new Set([new final.MissingOptionError('first')]))
          })
        })

        context('given the required option', () => {
          it('returns no errors', () => {
            assert.deepEqual(command.validate(new Set(['first'])), new Set([]))
          })
        })

        context('given the optional option', () => {
          it('returns a MissingOptionError', () => {
            assert.deepEqual(command.validate(new Set(['second'])), new Set([new final.MissingOptionError('first')]))
          })
        })

        context('given an invalid option', () => {
          it('returns a MissingOptionError and an InvalidOptionError', () => {
            assert.deepEqual(command.validate(new Set(['invalid'])), new Set([new final.MissingOptionError('first'), new final.InvalidOptionError('invalid')]))
          })
        })

        context('given the required option and the optional option', () => {
          it('returns no errors', () => {
            assert.deepEqual(command.validate(new Set(['first', 'second'])), new Set([]))
          })
        })

        context('given the required option and an invalid option', () => {
          it('returns an InvalidOptionError', () => {
            assert.deepEqual(command.validate(new Set(['first', 'invalid'])), new Set([new final.InvalidOptionError('invalid')]))
          })
        })

        context('given the optional option and an invalid option', () => {
          it('returns a MissingOptionError and an InvalidOptionError', () => {
            assert.deepEqual(command.validate(new Set(['second', 'invalid'])), new Set([new final.MissingOptionError('first'), new final.InvalidOptionError('invalid')]))
          })
        })

        context('given the required option, the optional option, and an invalid option', () => {
          it('returns an InvalidOptionError', () => {
            assert.deepEqual(command.validate(new Set(['first', 'second', 'invalid'])), new Set([new final.InvalidOptionError('invalid')]))
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

    after(() => api.close())

    describe('constructor', () => {
      it('creates a server', () => {
        assert(api.server instanceof http.Server)
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

        http.get('http://localhost:3000', () =>
          done('Error: API server should be closed')
        ).on('error', () => done())
      })
    })

    describe('.options()', () => {
      it('returns options from the given request', () => {
        assert.deepEqual(final.API.options(req), stringOptions)
      })
    })

    describe('#run()', () => {
      var res

      function run (done) {
        api.run()
        http.get(req.url, (thisRes) => {
          res = thisRes
          done()
        }).on('error', done)
      }

      it('runs its server for the given command', run)

      describe('response', () => {
        before(run)

        it('has a 200 status code', () => {
          assert.strictEqual(res.statusCode, 200)
        })

        it('has a text/plain content type', () => {
          assert.strictEqual(res.headers['content-type'], 'text/plain')
        })

        it('has a body with a result', (done) => {
          res.on('data', (chunk) => {
            assert.strictEqual(chunk.toString('utf8'), '3\n')
            done()
          })
        })
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
        var expected = [
          'Usage: cli [options]',
          '',
          'Options:',
          '',
          '  --help               output usage information',
          '  --first              first number to add',
          '  --second             second number to add'
        ].join('\n')

        assert.strictEqual(cli.help(), expected)
      })
    })

    describe('.options()', () => {
      it('returns options from argv', () => {
        assert.deepEqual(final.CLI.options(), options)
      })
    })

    describe('#run()', () => {
      context('without the help flag', () => {
        it('runs a cli for the given command that prints a result', sinon.test(function () {
          this.stub(console, 'log')
          cli.run()

          sinon.assert.calledOnce(console.log)
          sinon.assert.calledWithExactly(console.log, '3')
        }))
      })

      context('with the help flag', () => {
        before(() => { args = 'node cli.js --help' })

        it('runs a cli for the given command that prints usage information')
      })
    })
  })
})
