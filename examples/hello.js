// Usage: final --command ./examples/hello.js

var final = require('..')

module.exports = new final.Command(() => 'Hello, world!')
