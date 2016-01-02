'use strict'
var http = require('http')
var minimist = require('minimist')
var url = require('url')

class Command {
  run (options) {
    return String(this.core(Command.convertOptions(options)))
  }

  static convertOptions (options) {
    return Object.keys(options).reduce((memo, key) => {
      memo[key] = String(options[key])
      return memo
    }, {})
  }
}

class Runner {
  constructor (command) {
    this.command = command
  }
}

class API extends Runner {
  constructor (command) {
    super(command)
    this.server = http.createServer(this.callback.bind(this))
  }

  static options (req) {
    return url.parse(req.url, true).query
  }

  callback (req, res) {
    res.setHeader('content-type', 'text/plain')
    res.writeHead(200)
    res.end(`${this.command.run(API.options(req))}\n`)
  }

  close () {
    this.server.close()
  }

  run () {
    this.server.listen(3000)
  }
}

class CLI extends Runner {
  static options () {
    var args = minimist(process.argv.slice(2))

    var options = Object.assign({}, args)
    delete options._
    return Command.convertOptions(options)
  }

  run () {
    console.log(this.command.run(CLI.options()))
  }
}

module.exports = { Command, Runner, API, CLI }
