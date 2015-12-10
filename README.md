# Final
[![Build Status](https://travis-ci.org/nicolasmccurdy/final.svg?branch=master)](https://travis-ci.org/nicolasmccurdy/final)
[![Dependency Status](https://gemnasium.com/nicolasmccurdy/final.svg)](https://gemnasium.com/nicolasmccurdy/final)
[![Code Climate](https://codeclimate.com/github/nicolasmccurdy/final/badges/gpa.svg)](https://codeclimate.com/github/nicolasmccurdy/final)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com/)

A set of tools for writing JavaScript code once that runs on the command line, browser, and more.

## Project Status
Final is in early (pre-1.0) development. It is usable, but its API may change frequently until it reaches 1.0. Additionally, several core features (and runners) have not been implemented yet.

## Examples
The examples below can be run in a Node.js script or shell.

### Getting Started
First, create a function using the Final specification. Skip to the Usage section for more information about how to write Final functions.
```javascript
function add(options) {
  var first = parseInt(options.first, 10)
  var second = parseInt(options.second, 10)

  return first + second
}
```
This Final function is just an ordinary JavaScript function that meets a certain spec, so we can call it from normal Node.js source code.
```javascript
var result = add({ first: '1', second: '2' })
console.log(result)
```

### Generating Servers
Final can generate callbacks for Node's `http.Server` class, allowing you to run web servers wrapping functions and even embedding functions in larger Node web apps.
```javascript
var final = require('final')
new final.Server(add).run()
```
Here, Final starts a web server at `localhost:3000` that wraps your function. You can call the function with HTTP requests like `GET localhost:3000?first=1&second=2`, and you will get a plain text response with the result.

### Generating Commands
Final also has a helper for creating command line interfaces around your
function.
```javascript
var final = require('final')
new final.CLI(add).run()
```
Final will read arguments from the command running this JavaScript code, and
then it will immediately run the function with the given options and print the
result to STDOUT. For example, try putting this in `add.js` and running
`node add --first 1 --second 2` in the same directory.

## Installation
1. Install [Node.js](https://nodejs.org/en/) (version 4 or higher)
2. `npm install --save final`
3. `var final = require ('final')`

## License
[ISC](LICENSE) (it's similar to MIT, but simpler)
