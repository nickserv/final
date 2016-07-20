#!/usr/bin/env node
var final = require('.')
var CLI = final.CLI
var Command = final.Command

function core (options) {
  new CLI(require(options.command)).run()
}

new CLI(new Command(core)).run()
