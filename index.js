'use strict'
var _ = require('lodash')
var http = require('http')
var minimist = require('minimist')
var url = require('url')

class Command {
  constructor (core) {
    this.core = core
  }

  run (options) {
    return String(this.core(_.mapValues(options, String)))
  }
}

class CommandGroup {
  constructor (commands) {
    this.commands = commands
  }

  run (options) {
    var path = options._path

    if (path) {
      // TODO: Don't modify options
      options._path.splice(1)
      return this.commands[path[0]].run(options)
    }
  }
}

class Runner {
  constructor (command) {
    this.command = command
  }

  run () {
    if (this.command instanceof Command) {
      this.runCommand(this.command)
    } else if (this.command instanceof CommandGroup) {
      this.runGroup(this.command)
    }
  }
}

class API extends Runner {
  constructor (command) {
    super(command)
    this.server = http.createServer(this.callback.bind(this))
  }

  callback (req, res) {
    res.setHeader('content-type', 'text/plain')
    res.writeHead(200)
    res.end(`${this.command.run(API.options(req))}\n`)
  }

  close () {
    this.server.close()
  }

  static options (req) {
    return url.parse(req.url, true).query
  }

  runCommand () {
    this.server.listen(3000)
  }
}

class CLI extends Runner {
  static options () {
    var args = minimist(process.argv.slice(2))
    return _.omit(args, '_')
  }

  runCommand () {
    console.log(this.command.run(CLI.options()))
  }
}

module.exports = { Command, Runner, API, CLI }
