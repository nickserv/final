var minimist = require('minimist');
var url = require('url');

module.exports = {
	createCommand: function (core) {
		return function () {
			var args = minimist(process.argv.slice(2));
			delete args._;
			Object.keys(args).forEach(function (key) {
				args[key] = String(args[key]);
			});

			var result = core(args);
			console.log(result);
		};
	},

	createServer: function (core) {
		return function (req, res) {
			var args = url.parse(req.url, true).query;
			var result = core(args) + '\n';

			res.writeHead(200);
			res.end(result);
		};
	},
};
