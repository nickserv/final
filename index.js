'use strict'
var http = require('http')
var minimist = require('minimist')
var url = require('url')

var final = {
  createServer (core) {
    return (req, res) => {
      var args = url.parse(req.url, true).query
      var result = core(args) + '\n'

      res.writeHead(200)
      res.end(result)
    }
  },

  runServer (core) {
    http.createServer(final.createServer(core)).listen(3000)
  }
}

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

module.exports = final
