var add = require('./add');
var http = require('http');
var url = require('url');

var server = http.createServer(function (req, res) {
	var args = url.parse(req.url, true).query;
	var result = add(args) + '\n';

	res.writeHead(200);
	res.end(result);
});

server.listen(3000);
