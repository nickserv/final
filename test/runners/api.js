/* global Command, runners */
var _ = require('lodash')
var http = require('http')
var request = require('supertest')
var url = require('url')

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

var command = new Command(commandCore, commandOptions)
var erroringCommand = new Command(() => { throw new Error() })

var options = { first: 1, second: 2 }
var stringOptions = _.mapValues(options, String)

describe('runners.API', () => {
  var api
  beforeEach(() => { api = new runners.API(command) })
  afterEach(() => api.close())

  var req = new http.IncomingMessage()
  req.url = 'http://localhost:3000?first=1&second=2'
  var parsedReq = url.parse(req.url)

  describe('constructor', () => {
    it('creates a server', () => {
      api.server.should.be.an.instanceof(http.Server)
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

    context('with a failing command', () => {
      beforeEach(() => { api = new runners.API(erroringCommand) })

      it('responds with an internal server error', (done) => {
        api.command.should.equal(erroringCommand)

        request(api.server)
          .get('')
          .expect(500, '')
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
          err ? done() : done('Error: runners.API server should be closed')
        })
    })
  })

  describe('.options()', () => {
    it('returns options from the given request', () => {
      runners.API.options(req).should.deep.equal(stringOptions)
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
