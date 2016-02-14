'use strict'
var http = require('http')
var Command = require('../command')
var Runner = require('../runner')
var url = require('url')

module.exports = class API extends Runner {
  constructor (command) {
    super(command)

    this.server = http.createServer((req, res) => {
      try {
        var body = `${this.command.run(API.options(req))}\n`
        res.setHeader('content-type', 'text/plain')
        res.writeHead(200)
      } catch (e) {
        res.setHeader('content-type', 'application/json')

        if (e instanceof Command.ValidationError) {
          body = JSON.stringify(e.toJSON())
          res.writeHead(403)
        } else {
          body = null
          res.writeHead(500)
        }
      } finally {
        res.end(body)
      }
    })
  }

  close () {
    this.server.close()
  }

  static options (req) {
    var query = url.parse(req.url, true).query

    // Force the result to extend Object.prototype for testing
    return Object.assign({}, query)
  }

  runCommand () {
    this.server.listen(3000)
  }
}
