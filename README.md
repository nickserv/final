# Final
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com/)

A set of tools for writing JavaScript code once that runs on the command line, browser, and more.

## Examples
The examples below can be run in a Node.js script or shell.

```javascript
/*
First, create a function using the Final specification. Skip to the Usage
section for more information about how to write Final functions.
*/
function add(options) {
  var x = parseInt(options.x, 10)
  var y = parseInt(options.y, 10)

  return x + y
}

/*
This Final function is just an ordinary JavaScript function that meets a certain
spec, so we can call it from normal Node.js source code.
*/
var result = add({ x: '1', y: '2' })
console.log(result)

/*
Final can generate callbacks for Node's `http.Server` class, allowing you to run
web servers wrapping functions and even embedding functions in larger Node web
apps.
*/
var final = require('final')
final.runServer(add)
/*
Here, Final starts a web server at `localhost:3000` that wraps your function.
You can call the function with HTTP requests like `GET localhost:3000?x=1&y=2`,
and you will get a plain text response with the result.
*/

/*
Final also has a helper for creating command line interfaces around your
function.
*/
var final = require('final')
final.runCommand(add)
/*
Final will read arguments from the command running this JavaScript code, and
then it will immediately run the function with the given options and print the
result to STDOUT. For example, try putting this in `add.js` and running
`node add -x 1 -y 2` in the same directory.
*/
```
