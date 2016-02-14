'use strict'
module.exports = class CommandGroup {
  constructor (commands) {
    this.commands = commands
  }

  run (options) {
    var path = options._path

    if (path) {
      // TODO: Don't modify options
      options._path.splice(1)
      return this.commands[path[0]].run(options)
    }
  }
}
