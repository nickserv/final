'use strict'
var http = require('http')
var minimist = require('minimist')
var url = require('url')

class Runner {
  constructor (core) {
    this.core = core
  }
}

class CLI extends Runner {
  options () {
    var args = minimist(process.argv.slice(2))
    delete args._
    Object.keys(args).forEach(key => args[key] = String(args[key]))
    return args
  }

  run () {
    console.log(this.core(this.options()))
  }
}

class Server extends Runner {
  constructor (core) {
    super(core)
    this.server = http.createServer(this.callback.bind(this))
  }

  options (req) {
    return url.parse(req.url, true).query
  }

  callback (req, res) {
    res.setHeader('content-type', 'text/plain')
    res.writeHead(200)
    res.end(`${this.core(this.options(req))}\n`)
  }

  close () {
    this.server.close()
  }

  run () {
    this.server.listen(3000)
  }
}

module.exports = { Runner, CLI, Server }
