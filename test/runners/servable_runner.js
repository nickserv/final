/* global command, runners, stringOptions */
var http = require('http')
var request = require('supertest')
var url = require('url')

describe('runners.ServableRunner', () => {
  var servableRunner
  beforeEach(() => {
    servableRunner = new runners.ServableRunner(command)
    servableRunner.server = new http.Server((req, res) => { res.end() })
  })
  afterEach(() => servableRunner.close())

  var req = new http.IncomingMessage()
  req.url = 'http://localhost:3000?first=1&second=2'
  var parsedReq = url.parse(req.url)

  describe('constructor', () => {
    it('creates a server', () => {
      servableRunner.server.should.be.an.instanceof(http.Server)
    })
  })

  describe('#close()', () => {
    it('closes the server', (done) => {
      servableRunner.close()

      request(parsedReq.host)
        .get(parsedReq.path)
        .end((err) => {
          err ? done() : done('Error: runners.ServableRunner server should be closed')
        })
    })
  })

  describe('.options()', () => {
    it('returns options from the given request', () => {
      runners.ServableRunner.options(req).should.deep.equal(stringOptions)
    })
  })

  describe('#run()', () => {
    it('runs its server for the given command', (done) => {
      servableRunner.run()

      request(parsedReq.host)
        .get(parsedReq.path)
        .end(done)
    })
  })
})
