require('./helper')
var sinon = require('sinon')

describe('final.CLI', () => {
  var cli

  beforeEach(() => cli = new final.CLI(add))

  describe('constructor', () => {
    it('creates a new CLI with the given core', () => {
      assert.equal(cli.core, add)
    })
  })

  describe('#run()', () => {
    it('runs a cli for the given core', sinon.test(function () {
      this.stub(console, 'log')
      process.argv = 'node cli.js -x 1 -y 2'.split(' ')
      cli.run()

      sinon.assert.calledOnce(console.log)
      sinon.assert.calledWithExactly(console.log, 3)
    }))
  })
})
