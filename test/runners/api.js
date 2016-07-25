/* global command, erroringCommand, runners */
var http = require('http')
var request = require('supertest')
var url = require('url')

describe('runners.API', () => {
  var api
  beforeEach(() => { api = new runners.API(command) })
  afterEach(() => api.close())

  var req = new http.IncomingMessage()
  req.url = 'http://localhost:3000?first=1&second=2'
  var parsedReq = url.parse(req.url)

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
})
