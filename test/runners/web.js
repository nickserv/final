/* global command, runners */
var request = require('supertest')

describe('runners.Web', () => {
  var web = new runners.Web(command)

  describe('#server', () => {
    it('serves /', (done) => {
      request(web.server)
        .get('/')
        .expect(200)
        .expect('content-type', /text\/html/)
        .end(done)
    })

    it('serves /result', (done) => {
      request(web.server)
        .get('/result?first=1&second=2')
        .expect(200, /3/)
        .expect('content-type', /text\/html/)
        .end(done)
    })
  })
})
