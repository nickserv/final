/* global command, runners */
var http = require('http')

describe('runners.Web', () => {
  var indexURL = 'http://localhost:3000/'
  var resultURL = indexURL + 'result?first=1&second=2'

  var web
  beforeEach(() => { web = new runners.Web(command) })
  afterEach(() => web.close())

  describe('constructor', () => {
    it('creates a web app with a server', () => {
      web.server.should.be.an.instanceof(http.Server)
    })
  })

  describe('#close()', () => {
    it('closes the web server', (done) => {
      web.close()

      http.get(indexURL, (res) =>
        done('Error: runners.Web server should be closed')
      ).on('error', () => done())
    })
  })

  describe('#createApp()', () => {
    it('returns a new Express app', () => {
      web.createApp().should.be.an.instanceof(Function)
    })
  })

  describe('#run()', () => {
    it('runs a web app for the given command', (done) => {
      web.run()

      http.get(indexURL, (res) => {
        res.statusCode.should.equal(200)
        res.headers['content-type'].should.include('text/html')
      }).on('error', done)

      http.get(resultURL, (res) => {
        res.statusCode.should.equal(200)
        res.headers['content-type'].should.include('text/html')

        res.on('data', (chunk) => {
          chunk.toString('utf8').should.include(3)
          done()
        })
      }).on('error', done)
    })
  })
})
