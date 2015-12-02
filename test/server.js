/* global afterEach, beforeEach, describe, it */
var add = require('./support/add')
var assert = require('assert')
var final = require('..')
var http = require('http')

describe('final.Server', () => {
  var server

  beforeEach(() => server = new final.Server(add))

  afterEach(() => server.close())

  describe('constructor', () => {
    it('creates a new Server with the given core', () => {
      assert.equal(server.core, add)
    })

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

      http.get('http://localhost:3000', res => {
        done('Error: Server should be closed')
      }).on('error', () => done())
    })
  })

  describe('#run()', () => {
    it('runs a Server for the given core', (done) => {
      server.run()

      http.get('http://localhost:3000?x=1&y=2', res => {
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
