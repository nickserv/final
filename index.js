'use strict'
var http = require('http')
var minimist = require('minimist')
var url = require('url')

class Command {
  run (options) {
    return this.core(options)
  }
}

class Runner {
  constructor (command) {
    this.command = command
  }
}

class CLI extends Runner {
  options () {
    var args = minimist(process.argv.slice(2))

    return Object.keys(args).reduce((memo, key) => {
      if (key !== '_') memo[key] = String(args[key])
      return memo
    }, {})
  }

  run () {
    console.log(this.command.run(this.options()))
  }
}

class Server extends Runner {
  constructor (command) {
    super(command)
    this.server = http.createServer(this.callback.bind(this))
  }

  options (req) {
    return url.parse(req.url, true).query
  }

  callback (req, res) {
    res.setHeader('content-type', 'text/plain')
    res.writeHead(200)
    res.end(`${this.command.run(this.options(req))}\n`)
  }

  close () {
    this.server.close()
  }

  run () {
    this.server.listen(3000)
  }
}

module.exports = { Command, Runner, CLI, Server }
