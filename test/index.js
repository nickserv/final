'use strict'
var assert = require('assert')
var final = require('..')
var http = require('http')
var sinon = require('sinon')

class Adder extends final.Command {
  constructor () {
    super()
    this.requiredOptions = ['first', 'second']
  }

  core (options) {
    var first = parseInt(options.first, 10)
    var second = parseInt(options.second, 10)

    return first + second
  }
}

class Greeter extends final.Command {
  core () {
    return 'Hello, world!'
  }
}

describe('final', () => {
  var command = new Adder()

  describe('Command', () => {
    describe('#run()', () => {
      context('with valid options', () => {
        it('returns a result', () => {
          assert.strictEqual(new Adder().run({ first: '1', second: '2' }), '3')
        })
      })

      context('with invalid options', () => {
        it('throws an error', () => {
          assert.throws(() => new Adder().run({ invalid: '1', second: '2' }),
                        final.ValidationError)
        })
      })
    })

    describe('#validate()', () => {
      context('without any required options', () => {
        it('returns true', () => {
          var command = new Greeter()
          assert.equal(command.validate(Object.keys([])), true)
        })
      })

      context('with valid options', () => {
        it('returns true', () => {
          assert.strictEqual(command.validate(Object.keys({ first: '1', second: '2' })), true)
        })
      })

      context('with invalid options', () => {
        it('returns false', () => {
          assert.strictEqual(command.validate(Object.keys({ invalid: '1', second: '2' })), false)
        })
      })
    })
  })

  describe('Runner', () => {
    var runner = new final.Runner(command)

    describe('constructor', () => {
      it('creates a new Runner with the given command', () => {
        assert.strictEqual(runner.command, command)
      })
    })
  })

  describe('CLI', () => {
    var cli = new final.CLI(command)

    process.argv = 'node cli.js --first 1 --second 2'.split(' ')

    describe('#options()', () => {
      it('returns args from argv', () => {
        assert.deepStrictEqual(cli.options(), { first: '1', second: '2' })
      })
    })

    describe('#run()', () => {
      it('runs a cli for the given command', sinon.test(function () {
        this.stub(console, 'log')
        cli.run()

        sinon.assert.calledOnce(console.log)
        sinon.assert.calledWithExactly(console.log, '3')
      }))
    })
  })

  describe('Server', () => {
    var req = { url: 'http://localhost:3000?first=1&second=2' }

    var server
    beforeEach(() => server = new final.Server(command))
    afterEach(() => server.close())

    describe('constructor', () => {
      it('creates a new Server with a callback', () => {
        assert(server.callback instanceof Function)
        assert.strictEqual(server.callback.length, 2)
      })

      it('creates a new Server with a server', () => {
        assert(server.server instanceof http.Server)
      })
    })

    describe('#close()', () => {
      it('closes the Server', (done) => {
        server.close()

        http.get('http://localhost:3000', res =>
          done('Error: Server should be closed')
        ).on('error', () => done())
      })
    })

    describe('#options()', () => {
      it('returns options from the given request', () => {
        assert.deepStrictEqual(server.options(req), { first: '1', second: '2' })
      })
    })

    describe('#run()', () => {
      it('runs a Server for the given command', (done) => {
        server.run()

        http.get(req.url, res => {
          assert.strictEqual(res.statusCode, 200)
          assert.strictEqual(res.headers['content-type'], 'text/plain')

          res.on('data', (chunk) => {
            assert.strictEqual(chunk.toString('utf8'), '3\n')
            done()
          })
        }).on('error', done)
      })
    })
  })
})
