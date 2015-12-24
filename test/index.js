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
    var runner

    beforeEach(() => runner = new final.Runner(add))

    describe('constructor', () => {
      it('creates a new Runner with the given core', () => {
        assert.equal(runner.core, add)
      })
    })
  })

  describe('API', () => {
    var api

    beforeEach(() => api = new final.API(add))

    afterEach(() => api.close())

    describe('constructor', () => {
      it('creates a new API with a callback', () => {
        assert(api.callback instanceof Function)
        assert.equal(api.callback.length, 2)
      })

      it('creates a new API with a server', () => {
        assert(api.server instanceof http.Server)
      })
    })

    describe('#close()', () => {
      it('closes the API server', (done) => {
        api.close()

        http.get('http://localhost:3000', res => {
          done('Error: API server should be closed')
        }).on('error', () => done())
      })
    })

    describe('#run()', () => {
      it('runs an API for the given core', (done) => {
        api.run()

        http.get('http://localhost:3000?first=1&second=2', res => {
          assert.equal(res.statusCode, 200)
          assert.equal(res.headers['content-type'], 'text/plain')

          res.on('data', (chunk) => {
            assert.equal(chunk.toString('utf8'), '3\n')
            done()
          })
        }).on('error', done)
      })
    })
  })

  describe('CLI', () => {
    var cli

    beforeEach(() => cli = new final.CLI(add))

    describe('#run()', () => {
      it('runs a cli for the given core', sinon.test(function () {
        this.stub(console, 'log')
        process.argv = 'node cli.js --first 1 --second 2'.split(' ')
        cli.run()

        sinon.assert.calledOnce(console.log)
        sinon.assert.calledWithExactly(console.log, 3)
      }))
    })
  })
})
