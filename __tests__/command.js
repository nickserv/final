var Command = require('../lib/command')
var helper = require('../lib/helper')

describe('Command', () => {
  var invalidOptionError = new Command.InvalidOptionError('invalid')
  var missingOptionError = new Command.MissingOptionError('missing')
  var optionErrors = new Set([invalidOptionError, missingOptionError])
  var validationError = new Command.ValidationError(optionErrors)

  describe('.ValidationError', () => {
    describe('constructor', () => {
      test('sets name to ValidationError', () => {
        expect(validationError.name).toBe('ValidationError')
      })

      test('sets optionErrors', () => {
        expect(validationError.optionErrors).toBe(optionErrors)
      })
    })

    describe('#mapOptionErrors()', () => {
      test('maps over its optionErrors', () => {
        expect(validationError.mapOptionErrors((e) => e.option)).toEqual(['invalid', 'missing'])
      })
    })

    describe('#toJSON()', () => {
      test(
        'returns a JSON representation of itself, including its optionErrors, as an Object',
        () => {
          expect(validationError.toJSON()).toEqual(
            { errors: [{ name: 'InvalidOptionError', option: 'invalid' }, { name: 'MissingOptionError', option: 'missing' }] }
          )
        }
      )
    })

    describe('#toText()', () => {
      test('returns a textual representation of its optionErrors', () => {
        expect(validationError.toText()).toBe(
          'Error: Invalid option "invalid"\nError: Missing required option "missing"'
        )
      })
    })
  })

  describe('.OptionError', () => {
    var optionError = new Command.OptionError('option')

    describe('constructor', () => {
      test('sets name to OptionError', () => {
        expect(optionError.name).toBe('OptionError')
      })

      test('sets option', () => {
        expect(optionError.option).toBe('option')
      })
    })

    describe('#toJSON()', () => {
      test(
        'returns a JSON representation of the error\'s name and option as an Object',
        () => {
          expect(optionError.toJSON()).toEqual({ name: 'OptionError', option: 'option' })
        }
      )
    })
  })

  describe('.InvalidOptionError', () => {
    describe('constructor', () => {
      test('sets name to InvalidOptionError', () => {
        expect(invalidOptionError.name).toBe('InvalidOptionError')
      })
    })

    describe('#toText()', () => {
      test('returns a textual representation of itself', () => {
        expect(invalidOptionError.toText()).toBe('Error: Invalid option "invalid"')
      })
    })
  })

  describe('.MissingOptionError', () => {
    describe('constructor', () => {
      test('sets name to MissingOptionError', () => {
        expect(missingOptionError.name).toBe('MissingOptionError')
      })
    })

    describe('#toText()', () => {
      test('returns a textual representation of itself', () => {
        expect(missingOptionError.toText()).toBe('Error: Missing required option "missing"')
      })
    })
  })

  var greeting = 'Hello, world!'
  var simpleCommandCore = () => greeting
  var simpleCommand = new Command(simpleCommandCore)

  describe('constructor', () => {
    describe('for a command without options', () => {
      test('uses the given core', () => {
        expect(simpleCommand.core).toBe(simpleCommandCore)
      })

      test('doesn\'t use any options', () => {
        expect(simpleCommand.options).toBeFalsy()
      })
    })

    describe('for a command with required and optional options', () => {
      test('uses the given core', () => {
        expect(helper.command.core).toBe(helper.commandCore)
      })

      test('uses the given options', () => {
        expect(helper.command.options).toBe(helper.commandOptions)
      })
    })
  })

  describe('#createErrors()', () => {
    test('creates errors of the given class for the given options', () => {
      expect(Command.createErrors(Command.OptionError, ['one', 'two'])).toEqual(new Set([new Command.OptionError('one'), new Command.OptionError('two')]))
    })
  })

  describe('#run()', () => {
    describe('for a command without options', () => {
      describe('given empty options', () => {
        test('returns a String result', () => {
          expect(simpleCommand.run({})).toBe(greeting)
        })
      })

      describe('given any option', () => {
        test('returns a String result', () => {
          expect(simpleCommand.run({ extra: true })).toBe(greeting)
        })
      })
    })

    describe('for a command with required and optional options', () => {
      describe('given empty options', () => {
        test('throws a ValidationError', () => {
          expect(() => helper.command.run({})).toThrowError(Command.ValidationError)
        })
      })

      describe('given only the required option', () => {
        test('returns a String result', () => {
          expect(helper.command.run({ first: 1 })).toBe('1')
        })
      })

      describe('given only the optional option', () => {
        test('throws a ValidationError', () => {
          expect(() => helper.command.run({ second: 2 })).toThrowError(Command.ValidationError)
        })
      })

      describe('given both options', () => {
        test('returns a String result', () => {
          expect(helper.command.run(helper.options)).toBe('3')
        })
      })

      describe('given an invalid option', () => {
        test('throws a ValidationError', () => {
          expect(() => helper.command.run({ first: 1, invalid: true })).toThrowError(Command.ValidationError)
        })
      })
    })
  })

  describe('#validate()', () => {
    describe('for a command with no options', () => {
      describe('given no options', () => {
        test('returns no errors', () => {
          expect(simpleCommand.validate(new Set())).toEqual(new Set())
        })
      })

      describe('given an option', () => {
        test('returns no errors', () => {
          expect(simpleCommand.validate(new Set(['extra']))).toEqual(new Set())
        })
      })
    })

    describe('for a command with a required option and an optional option', () => {
      describe('given no options', () => {
        test('returns a MissingOptionError', () => {
          expect(helper.command.validate(new Set())).toEqual(new Set([
            new Command.MissingOptionError('first')
          ]))
        })
      })

      describe('given the required option', () => {
        test('returns no errors', () => {
          expect(helper.command.validate(new Set(['first']))).toEqual(new Set())
        })
      })

      describe('given the optional option', () => {
        test('returns a MissingOptionError', () => {
          expect(helper.command.validate(new Set(['second']))).toEqual(new Set([
            new Command.MissingOptionError('first')
          ]))
        })
      })

      describe('given an invalid option', () => {
        test('returns a MissingOptionError and an InvalidOptionError', () => {
          expect(helper.command.validate(new Set(['invalid']))).toEqual(new Set([
            new Command.MissingOptionError('first'),
            new Command.InvalidOptionError('invalid')
          ]))
        })
      })

      describe('given the required option and the optional option', () => {
        test('returns no errors', () => {
          expect(helper.command.validate(new Set(['first', 'second']))).toEqual(new Set())
        })
      })

      describe('given the required option and an invalid option', () => {
        test('returns an InvalidOptionError', () => {
          expect(helper.command.validate(new Set(['first', 'invalid']))).toEqual(new Set([
            new Command.InvalidOptionError('invalid')
          ]))
        })
      })

      describe('given the optional option and an invalid option', () => {
        test('returns a MissingOptionError and an InvalidOptionError', () => {
          expect(helper.command.validate(new Set(['second', 'invalid']))).toEqual(new Set([
            new Command.MissingOptionError('first'),
            new Command.InvalidOptionError('invalid')
          ]))
        })
      })

      describe(
        'given the required option, the optional option, and an invalid option',
        () => {
          test('returns an InvalidOptionError', () => {
            expect(helper.command.validate(new Set(['first', 'second', 'invalid']))).toEqual(new Set([
              new Command.InvalidOptionError('invalid')
            ]))
          })
        }
      )
    })
  })
})
