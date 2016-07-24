var _ = require('lodash')

module.exports = {
  concat: (a, b) => new Set(_.concat(Array.from(a), Array.from(b))),
  difference: (a, b) => new Set(_.difference(Array.from(a), Array.from(b))),
  keys: (object) => new Set(_.keys(object)),
  map: (set, callback) => new Set(Array.from(set).map(callback))
}
