/* global command, simpleCommand, group */
var sinon = require('sinon')

describe('CommandGroup', () => {
  var sandbox
  beforeEach(() => { sandbox = sinon.sandbox.create() })
  afterEach(() => { sandbox.restore() })

  describe('constructor', () => {
    it('uses the given commands', () => {
      group.commands.add.should.equal(command)
      group.commands.greet.should.equal(simpleCommand)
    })
  })

  describe('#run()', () => {
    var path

    beforeEach(() => {
      sandbox.stub(command, 'run')
      sandbox.stub(simpleCommand, 'run')

      group.run({ _path: path })
    })

    context('given an empty path', () => {
      before(() => { path = [] })

      it('throws an error')
    })

    context('given a path for the first command', () => {
      before(() => { path = ['add'] })

      it('runs the first command', () => {
        command.run.should.have.been.calledOnce
        simpleCommand.run.should.not.have.been.called
      })
    })

    context('given a path for the second command', () => {
      before(() => { path = ['greet'] })

      it('runs the second command', () => {
        command.run.should.not.have.been.called
        simpleCommand.run.should.have.been.calledOnce
      })
    })

    context('given a path for an invalid command', () => {
      before(() => { path = ['invalid'] })

      it('throws an error')
    })
  })
})
