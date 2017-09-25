var setHelper = require('../lib/set_helper.js')
var commandOptions = require('../lib/helper').commandOptions

describe('setHelper', () => {
  describe('#concat()', () => {
    test('concatenates Sets', () => {
      expect(setHelper.concat(new Set([1, 2]), new Set([3, 4]))).toEqual(new Set([1, 2, 3, 4]))
    })
  })

  describe('#difference()', () => {
    test('returns the difference of two Sets', () => {
      expect(setHelper.difference(new Set([1, 2]), new Set([2, 3]))).toEqual(new Set([1]))
    })
  })

  describe('#keys()', () => {
    test('returns the keys of the given Object', () => {
      expect(setHelper.keys(commandOptions)).toEqual(new Set(['first', 'second']))
    })
  })

  describe('#map()', () => {
    test('maps over a set', () => {
      expect(setHelper.map(new Set([1, 2]), (n) => n * 2)).toEqual(new Set([2, 4]))
    })
  })
})
