'use strict'
var _ = require('lodash')
var assert = require('assert')
var final = require('..')
var http = require('http')
var sinon = require('sinon')

describe('final', () => {
  var core = (options) => {
    var first = _.parseInt(options.first)
    var second = _.parseInt(options.second)

    return first + second
  }

  var command = new final.Command(
    core,
    { requiredOptions: ['first', 'second'] }
  )

  describe('Command', () => {
    var adder = command

    var greeter = new final.Command(() => 'Hello, world!')

    var superGreeter = new final.Command(
      (options) => `Hello, ${options.name || 'world'}!`,
      { allowedOptions: ['name'] }
    )

    describe('constructor', () => {
      it('creates a new Command with the given core', () => {
        assert.strictEqual(command.core, core)
      })
    })

    describe('#run()', () => {
      it('returns a result or throws an error if options are invalid', () => {
        assert.strictEqual(adder.run({ first: 1, second: 2 }), '3')
        assert.throws(() => adder.run({}), final.ValidationError)
        assert.throws(() => adder.run({ first: 1 }), final.ValidationError)
        assert.throws(() => adder.run({ invalid: 1 }), final.ValidationError)

        assert.strictEqual(greeter.run({}), 'Hello, world!')
        assert.strictEqual(greeter.run({ extra: 'option' }), 'Hello, world!')

        assert.strictEqual(superGreeter.run({}), 'Hello, world!')
        assert.strictEqual(superGreeter.run({ name: 'dude' }), 'Hello, dude!')
        assert.throws(() => superGreeter.run({ invalid: 'dude' }),
                     final.ValidationError)
      })
    })

    describe('#validate()', () => {
      it('returns true if the options are valid', () => {
        assert.strictEqual(adder.validate(['first', 'second']), true)
        assert.strictEqual(adder.validate([]), false)
        assert.strictEqual(adder.validate(['first']), false)
        assert.strictEqual(adder.validate(['invalid']), false)

        assert.strictEqual(greeter.validate([]), true)
        assert.strictEqual(greeter.validate(['extra']), true)

        assert.strictEqual(superGreeter.validate([]), true)
        assert.strictEqual(superGreeter.validate(['name']), true)
        assert.strictEqual(superGreeter.validate(['invalid']), false)
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

  describe('API', () => {
    var req = { url: 'http://localhost:3000?first=1&second=2' }

    var api
    beforeEach(() => { api = new final.API(command) })
    afterEach(() => api.close())

    describe('constructor', () => {
      it('creates a new API with a server', () => {
        assert(api.server instanceof http.Server)
      })
    })

    describe('#callback()', () => {
      it('takes a request and a response', () => {
        assert(api.callback instanceof Function)
        assert.strictEqual(api.callback.length, 2)
      })

      it('gives an accurate response', sinon.test(function () {
        var res = {
          end: sinon.stub(),
          setHeader: sinon.stub(),
          writeHead: sinon.stub()
        }

        api.callback(req, res)

        sinon.assert.calledOnce(res.end)
        sinon.assert.calledWithExactly(res.end, '3\n')
      }))
    })

    describe('#close()', () => {
      it('closes the API server', (done) => {
        api.close()

        http.get('http://localhost:3000', (res) =>
          done('Error: API server should be closed')
        ).on('error', () => done())
      })
    })

    describe('.options()', () => {
      it('returns options from the given request', () => {
        assert.deepStrictEqual(final.API.options(req), { first: '1', second: '2' })
      })
    })

    describe('#run()', () => {
      it('runs an API for the given command', (done) => {
        api.run()

        http.get(req.url, (res) => {
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

  describe('CLI', () => {
    var cli = new final.CLI(command)

    process.argv = 'node cli.js --first 1 --second 2'.split(' ')

    describe('.options()', () => {
      it('returns args from argv', () => {
        assert.deepStrictEqual(final.CLI.options(), { first: 1, second: 2 })
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
})
