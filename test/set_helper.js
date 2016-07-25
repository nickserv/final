/* global setHelper */

var commandOptions = {
  first: {
    description: 'first number to add',
    required: true
  },
  second: {
    description: 'second number to add'
  }
}

describe('setHelper', () => {
  describe('#concat()', () => {
    it('concatenates Sets', () => {
      setHelper.concat(new Set([1, 2]), new Set([3, 4])).should.deep.equal(new Set([1, 2, 3, 4]))
    })
  })

  describe('#difference()', () => {
    it('returns the difference of two Sets', () => {
      setHelper.difference(new Set([1, 2]), new Set([2, 3])).should.deep.equal(new Set([1]))
    })
  })

  describe('#keys()', () => {
    it('returns the keys of the given Object', () => {
      setHelper.keys(commandOptions).should.deep.equal(new Set(['first', 'second']))
    })
  })

  describe('#map()', () => {
    it('maps over a set', () => {
      setHelper.map(new Set([1, 2]), (n) => n * 2).should.deep.equal(new Set([2, 4]))
    })
  })
})
