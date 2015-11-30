var http = require('http')
var minimist = require('minimist')
var url = require('url')

var final = {
  createCommand: (core) => {
    return () => {
      var args = minimist(process.argv.slice(2))
      delete args._
      Object.keys(args).forEach((key) => args[key] = String(args[key]))

      var result = core(args)
      console.log(result)
    }
  },

  createServer: (core) => {
    return (req, res) => {
      var args = url.parse(req.url, true).query
      var result = core(args) + '\n'

      res.writeHead(200)
      res.end(result)
    }
  },

  runCommand: (core) => {
    final.createCommand(core)()
  },

  runServer: (core) => {
    http.createServer(final.createServer(core)).listen(3000)
  }
}

module.exports = final
