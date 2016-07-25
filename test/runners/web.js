/* global command, runners */
var http = require('http')

describe('runners.Web', () => {
  var indexURL = 'http://localhost:3000/'
  var resultURL = indexURL + 'result?first=1&second=2'

  var web
  beforeEach(() => { web = new runners.Web(command) })
  afterEach(() => web.close())

  describe('#server', () => {
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
