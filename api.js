var add = require('./add')
var final = require('.')
var http = require('http')

http.createServer(final.createServer(add)).listen(3000)
