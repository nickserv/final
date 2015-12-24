var assert = require('assert')
var final = require('..')
var http = require('http')
var sinon = require('sinon')

var add = function (options) {
  var first = parseInt(options.first, 10)
  var second = parseInt(options.second, 10)

  return first + second
}

describe('final', () => {
  describe('Runner', () => {
    var runner = new final.Runner(add)

    describe('constructor', () => {
      it('creates a new Runner with the given core', () => {
        assert.strictEqual(runner.core, add)
      })
    })
  })

  describe('API', () => {
    var req = { url: 'http://localhost:3000?first=1&second=2' }

    var api

    beforeEach(() => api = new final.API(add))

    afterEach(() => api.close())

    describe('constructor', () => {
      it('creates a new API with a callback', () => {
        assert(api.callback instanceof Function)
        assert.strictEqual(api.callback.length, 2)
      })

      it('creates a new API with a server', () => {
        assert(api.server instanceof http.Server)
      })
    })

    describe('#close()', () => {
      it('closes the API server', (done) => {
        api.close()

        http.get('http://localhost:3000', res =>
          done('Error: API server should be closed')
        ).on('error', () => done())
      })
    })

    describe('#options()', () => {
      it('returns options from the given request', () => {
        assert.deepStrictEqual(api.options(req), { first: '1', second: '2' })
      })
    })

    describe('#run()', () => {
      it('runs an API for the given core', (done) => {
        api.run()

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

  describe('CLI', () => {
    var cli = new final.CLI(add)

    process.argv = 'node cli.js --first 1 --second 2'.split(' ')

    describe('#options()', () => {
      it('returns args from argv', () => {
        assert.deepStrictEqual(cli.options(), { first: '1', second: '2' })
      })
    })

    describe('#run()', () => {
      it('runs a cli for the given core', sinon.test(function () {
        this.stub(console, 'log')
        cli.run()

        sinon.assert.calledOnce(console.log)
        sinon.assert.calledWithExactly(console.log, 3)
      }))
    })
  })
})
