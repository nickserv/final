/* global command, runners */
var http = require('http')

describe('runners.App', () => {
  var indexURL = 'http://localhost:3000/'
  var resultURL = indexURL + 'result?first=1&second=2'

  var app
  beforeEach(() => { app = new runners.App(command) })
  afterEach(() => app.close())

  describe('constructor', () => {
    it('creates a app with a server', () => {
      app.server.should.be.an.instanceof(http.Server)
    })
  })

  describe('#close()', () => {
    it('closes the app server', (done) => {
      app.close()

      http.get(indexURL, (res) =>
        done('Error: runners.App server should be closed')
      ).on('error', () => done())
    })
  })

  describe('#createApp()', () => {
    it('returns a new Express app', () => {
      app.createApp().should.be.an.instanceof(Function)
    })
  })

  describe('#run()', () => {
    it('runs an app for the given command', (done) => {
      app.run()

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
