var _ = require('lodash')

module.exports = {
  concat (a, b) {
    return new Set(_.concat(Array.from(a), Array.from(b)))
  },

  difference (a, b) {
    return new Set(_.difference(Array.from(a), Array.from(b)))
  },

  keys (object) {
    return new Set(_.keys(object))
  },

  map (set, callback) {
    return new Set(Array.from(set).map(callback))
  }
}
