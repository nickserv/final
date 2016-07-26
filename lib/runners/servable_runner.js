'use strict'
var Runner = require('../runner')
var url = require('url')

module.exports = class ServableRunner extends Runner {
  close () {
    this.server.close()
  }

  static options (req) {
    var query = url.parse(req.url, true).query

    // Force the result to extend Object.prototype for testing
    return Object.assign({}, query)
  }

  run () {
    this.server.listen(3000)
  }
}
