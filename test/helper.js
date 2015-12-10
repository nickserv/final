global.final = require('..')
global.assert = require('assert')

global.add = function (options) {
  var x = parseInt(options.x, 10)
  var y = parseInt(options.y, 10)

  return x + y
}
