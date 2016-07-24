'use strict'
var Command = require('./command')

module.exports = class Runner {
  constructor (commandOrCore, options) {
    if (commandOrCore instanceof Command) {
      this.command = commandOrCore
    } else {
      this.command = new Command(commandOrCore, options)
    }
  }
}
