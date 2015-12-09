'use strict'
var http = require('http')
var minimist = require('minimist')
var url = require('url')

class CLI {
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

class Server {
  constructor (core) {
    this.core = core
    this.server = http.createServer(this.callback.bind(this))
  }

  callback (req, res) {
    var args = url.parse(req.url, true).query
    var result = `${this.core(args)}\n`

    res.setHeader('content-type', 'text/plain')

    res.writeHead(200)
    res.end(result)
  }

  close () {
    this.server.close()
  }

  run () {
    this.server.listen(3000)
  }
}

module.exports = { CLI, Server }
