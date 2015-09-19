var add = require('./add');
var minimist = require('minimist');

var args = minimist(process.argv.slice(2));
delete args._;
Object.keys(args).forEach(function (key) {
	args[key] = String(args[key]);
});

var result = add(args);
console.log(result);
