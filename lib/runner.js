'use strict'
var Command = require('./command')
var CommandGroup = require('./command_group')

module.exports = class Runner {
  constructor (commandOrCore, options) {
    if (commandOrCore instanceof Command ||
        commandOrCore instanceof CommandGroup) {
      this.command = commandOrCore
    } else {
      this.command = new Command(commandOrCore, options)
    }
  }

  run () {
    if (this.command instanceof Command) {
      this.runCommand(this.command)
    } else if (this.command instanceof CommandGroup) {
      this.runGroup(this.command)
    }
  }
}
