var chai = require('chai')
var final = require('..')
var sinonChai = require('sinon-chai')

Object.assign(global, final)

global.should = chai.should()
chai.use(sinonChai)
