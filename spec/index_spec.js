'use strict'
var _ = require('lodash')
var final = require('..')
var http = require('http')

describe('final', () => {
  function core (options) {
    return _.parseInt(options.first) + _.parseInt(options.second)
  }

  var command = new final.Command(core)

  var options = { first: 1, second: 2 }
  var stringOptions = _.mapValues(options, String)

  describe('Command', () => {
    describe('constructor', () => {
      it('uses the given core', () => {
        expect(command.core).toBe(core)
      })
    })

    describe('#run()', () => {
      it('returns a String result', () => {
        expect(command.run(options)).toBe('3')
      })
    })
  })

  describe('Runner', () => {
    describe('constructor', () => {
      it('uses the given command', () => {
        expect(new final.Runner(command).command).toBe(command)
      })
    })
  })

  describe('API', () => {
    var api = new final.API(command)

    var req = new http.IncomingMessage()
    req.url = 'http://localhost:3000?first=1&second=2'

    afterEach(() => api.close())

    describe('constructor', () => {
      it('creates a server', () => {
        expect(api.server instanceof http.Server)
      })
    })

    describe('#callback()', () => {
      it('is a function', () => {
        expect(api.callback instanceof Function)
      })

      it('takes a request and a response', () => {
        expect(api.callback.length).toBe(2)
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
        var objectContainingOptions = jasmine.objectContaining(stringOptions)

        expect(final.API.options(req)).toEqual(objectContainingOptions)
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
        beforeEach(run)

        it('has a 200 status code', () => {
          expect(res.statusCode).toBe(200)
        })

        it('has a text/plain content type', () => {
          expect(res.headers['content-type']).toBe('text/plain')
        })

        it('has a body with a result', (done) => {
          res.on('data', (chunk) => {
            expect(chunk.toString('utf8')).toBe('3\n')
            done()
          })
        })
      })
    })
  })

  describe('CLI', () => {
    var cli = new final.CLI(command)
    process.argv = 'node cli.js --first 1 --second 2'.split(' ')

    describe('.options()', () => {
      it('returns options from argv', () => {
        expect(final.CLI.options()).toEqual(options)
      })
    })

    describe('#run()', () => {
      it('runs a cli for the given command that prints a result', () => {
        spyOn(console, 'log')
        cli.run()

        expect(console.log).toHaveBeenCalledTimes(1)
        expect(console.log).toHaveBeenCalledWith('3')
      })
    })
  })
})