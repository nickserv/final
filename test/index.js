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
        assert.equal(runner.core, add)
      })
    })
  })

  describe('CLI', () => {
    var cli = new final.CLI(add)

    process.argv = 'node cli.js --first 1 --second 2'.split(' ')

    describe('#options()', () => {
      it('returns args from argv', () => {
        assert.deepEqual(cli.options(), { first: '1', second: '2' })
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

  describe('Server', () => {
    var req = { url: 'http://localhost:3000?first=1&second=2' }

    var server

    beforeEach(() => server = new final.Server(add))

    afterEach(() => server.close())

    describe('constructor', () => {
      it('creates a new Server with a callback', () => {
        assert(server.callback instanceof Function)
        assert.equal(server.callback.length, 2)
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
        assert.deepEqual(server.options(req), { first: '1', second: '2' })
      })
    })

    describe('#run()', () => {
      it('runs a Server for the given core', (done) => {
        server.run()

        http.get(req.url, res => {
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
})
