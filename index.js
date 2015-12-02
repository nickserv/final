'use strict'
var http = require('http')
var minimist = require('minimist')
var url = require('url')

var final = {}

final.CLI = class CLI {
  constructor (core) {
    this.core = core
  }

  run () {
    var args = minimist(process.argv.slice(2))
    delete args._
    Object.keys(args).forEach(key => args[key] = String(args[key]))

    var result = this.core(args)
    console.log(result)
  }
}

final.Server = class Server {
  constructor (core) {
    this.core = core
    this.callback = (req, res) => {
      var args = url.parse(req.url, true).query
      var result = core(args) + '\n'

      res.setHeader('content-type', 'text/plain')
      res.writeHead(200)
      res.end(result)
    }
    this.server = http.createServer(this.callback)
  }

  close () {
    this.server.close()
  }

  run () {
    this.server.listen(3000)
  }
}

module.exports = final
