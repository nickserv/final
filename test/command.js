/* global Command, command, commandCore, commandOptions, options, should */
describe('Command', () => {
  var invalidOptionError = new Command.InvalidOptionError('invalid')
  var missingOptionError = new Command.MissingOptionError('missing')
  var optionErrors = new Set([invalidOptionError, missingOptionError])
  var validationError = new Command.ValidationError(optionErrors)

  describe('.ValidationError', () => {
    describe('constructor', () => {
      it('sets name to ValidationError', () => {
        validationError.name.should.equal('ValidationError')
      })

      it('sets optionErrors', () => {
        validationError.optionErrors.should.equal(optionErrors)
      })
    })

    describe('#mapOptionErrors()', () => {
      it('maps over its optionErrors', () => {
        validationError.mapOptionErrors((e) => e.option).should.deep.equal(['invalid', 'missing'])
      })
    })

    describe('#toJSON()', () => {
      it('returns a JSON representation of itself, including its optionErrors, as an Object', () => {
        validationError.toJSON().should.deep.equal({ errors: [{ name: 'InvalidOptionError', option: 'invalid' }, { name: 'MissingOptionError', option: 'missing' }] })
      })
    })

    describe('#toText()', () => {
      it('returns a textual representation of its optionErrors', () => {
        validationError.toText().should.equal('Error: Invalid option "invalid"\nError: Missing required option "missing"')
      })
    })
  })

  describe('.OptionError', () => {
    var optionError = new Command.OptionError('option')

    describe('constructor', () => {
      it('sets name to OptionError', () => {
        optionError.name.should.equal('OptionError')
      })

      it('sets option', () => {
        optionError.option.should.equal('option')
      })
    })

    describe('#toJSON()', () => {
      it('returns a JSON representation of the error\'s name and option as an Object', () => {
        optionError.toJSON().should.deep.equal({ name: 'OptionError', option: 'option' })
      })
    })
  })

  describe('.InvalidOptionError', () => {
    describe('constructor', () => {
      it('sets name to InvalidOptionError', () => {
        invalidOptionError.name.should.equal('InvalidOptionError')
      })
    })

    describe('#toText()', () => {
      it('returns a textual representation of itself', () => {
        invalidOptionError.toText().should.equal('Error: Invalid option "invalid"')
      })
    })
  })

  describe('.MissingOptionError', () => {
    describe('constructor', () => {
      it('sets name to MissingOptionError', () => {
        missingOptionError.name.should.equal('MissingOptionError')
      })
    })

    describe('#toText()', () => {
      it('returns a textual representation of itself', () => {
        missingOptionError.toText().should.equal('Error: Missing required option "missing"')
      })
    })
  })

  var greeting = 'Hello, world!'
  var simpleCommandCore = () => greeting
  var simpleCommand = new Command(simpleCommandCore)

  describe('constructor', () => {
    context('for a command without options', () => {
      it('uses the given core', () => {
        simpleCommand.core.should.equal(simpleCommandCore)
      })

      it('doesn\'t use any options', () => {
        should.not.exist(simpleCommand.options)
      })
    })

    context('for a command with required and optional options', () => {
      it('uses the given core', () => {
        command.core.should.equal(commandCore)
      })

      it('uses the given options', () => {
        command.options.should.equal(commandOptions)
      })
    })
  })

  describe('#createErrors()', () => {
    it('creates errors of the given class for the given options', () => {
      Command.createErrors(Command.OptionError, ['one', 'two']).should.deep.equal(new Set([new Command.OptionError('one'), new Command.OptionError('two')]))
    })
  })

  describe('#run()', () => {
    context('for a command without options', () => {
      context('given empty options', () => {
        it('returns a String result', () => {
          simpleCommand.run({}).should.equal(greeting)
        })
      })

      context('given any option', () => {
        it('returns a String result', () => {
          simpleCommand.run({ extra: true }).should.equal(greeting)
        })
      })
    })

    context('for a command with required and optional options', () => {
      context('given empty options', () => {
        it('throws a ValidationError', () => {
          (() => command.run({})).should.throw(Command.ValidationError)
        })
      })

      context('given only the required option', () => {
        it('returns a String result', () => {
          command.run({ first: 1 }).should.equal('1')
        })
      })

      context('given only the optional option', () => {
        it('throws a ValidationError', () => {
          (() => command.run({ second: 2 })).should.throw(Command.ValidationError)
        })
      })

      context('given both options', () => {
        it('returns a String result', () => {
          command.run(options).should.equal('3')
        })
      })

      context('given an invalid option', () => {
        it('throws a ValidationError', () => {
          (() => command.run({ first: 1, invalid: true })).should.throw(Command.ValidationError)
        })
      })
    })
  })

  describe('#validate()', () => {
    context('for a command with no options', () => {
      context('given no options', () => {
        it('returns no errors', () => {
          simpleCommand.validate(new Set()).should.deep.equal(new Set())
        })
      })

      context('given an option', () => {
        it('returns no errors', () => {
          simpleCommand.validate(new Set(['extra'])).should.deep.equal(new Set())
        })
      })
    })

    context('for a command with a required option and an optional option', () => {
      context('given no options', () => {
        it('returns a MissingOptionError', () => {
          command.validate(new Set()).should.deep.equal(new Set([
            new Command.MissingOptionError('first')
          ]))
        })
      })

      context('given the required option', () => {
        it('returns no errors', () => {
          command.validate(new Set(['first'])).should.deep.equal(new Set())
        })
      })

      context('given the optional option', () => {
        it('returns a MissingOptionError', () => {
          command.validate(new Set(['second'])).should.deep.equal(new Set([
            new Command.MissingOptionError('first')
          ]))
        })
      })

      context('given an invalid option', () => {
        it('returns a MissingOptionError and an InvalidOptionError', () => {
          command.validate(new Set(['invalid'])).should.deep.equal(new Set([
            new Command.MissingOptionError('first'),
            new Command.InvalidOptionError('invalid')
          ]))
        })
      })

      context('given the required option and the optional option', () => {
        it('returns no errors', () => {
          command.validate(new Set(['first', 'second'])).should.deep.equal(new Set())
        })
      })

      context('given the required option and an invalid option', () => {
        it('returns an InvalidOptionError', () => {
          command.validate(new Set(['first', 'invalid'])).should.deep.equal(new Set([
            new Command.InvalidOptionError('invalid')
          ]))
        })
      })

      context('given the optional option and an invalid option', () => {
        it('returns a MissingOptionError and an InvalidOptionError', () => {
          command.validate(new Set(['second', 'invalid'])).should.deep.equal(new Set([
            new Command.MissingOptionError('first'),
            new Command.InvalidOptionError('invalid')
          ]))
        })
      })

      context('given the required option, the optional option, and an invalid option', () => {
        it('returns an InvalidOptionError', () => {
          command.validate(new Set(['first', 'second', 'invalid'])).should.deep.equal(new Set([
            new Command.InvalidOptionError('invalid')
          ]))
        })
      })
    })
  })
})
