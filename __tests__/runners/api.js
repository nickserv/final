var API = require('../../lib/runners/api')
var helper = require('../../lib/helper')
var http = require('http')
var request = require('supertest')
var url = require('url')

describe('runners.API', () => {
  var api
  beforeEach(() => { api = new API(helper.command) })
  afterEach(() => api.close())

  var req = new http.IncomingMessage()
  req.url = 'http://localhost:3000?first=1&second=2'
  var parsedReq = url.parse(req.url)

  describe('constructor', () => {
    test('creates a server', () => {
      expect(api.server).toBeInstanceOf(http.Server)
    })
  })

  describe('#server', () => {
    describe('given valid options', () => {
      test('responds with a result', (done) => {
        request(api.server)
          .get(parsedReq.path)
          .expect(200, '3\n')
          .expect('content-type', 'text/plain')
          .end(done)
      })
    })

    describe('given invalid options', () => {
      test('responds with validation errors', (done) => {
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

    describe('with a failing command', () => {
      beforeEach(() => { api = new API(helper.erroringCommand) })

      test('responds with an internal server error', (done) => {
        expect(api.command).toBe(helper.erroringCommand)

        request(api.server)
                           .get('')
                           .expect(500, '')
                           .expect('content-type', 'application/json')
                           .end(done)
      })
    })
  })

  describe('#close()', () => {
    test('closes the server', () => {
      api.run()
      expect(api.server.listening).toBe(true)
      api.close()
      expect(api.server.listening).toBe(false)
    })
  })

  describe('.options()', () => {
    test('returns options from the given request', () => {
      expect(API.options(req)).toEqual(helper.stringOptions)
    })
  })

  describe('#run()', () => {
    test('runs its server for the given command', (done) => {
      api.run()

      request(parsedReq.host)
         .get(parsedReq.path)
         .end(done)
    })
  })
})
