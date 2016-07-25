'use strict'
var http = require('http')
var Command = require('../command')
var ServableRunner = require('./servable_runner')

module.exports = class API extends ServableRunner {
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
}
