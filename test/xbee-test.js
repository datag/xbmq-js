/* global describe it beforeEach xit */
var chai = require('chai')
var chaiAsPromised = require('chai-as-promised')
chai.use(chaiAsPromised)
var expect = chai.expect

var XBee = require('../lib/xbee.js')
var SerialPort = require('serialport')
var VirtualSerialPort = require('virtual-serialport')
var XBeeAPI = require('xbee-api')

describe('XBee', function () {
  var xbee, options
  beforeEach(function () {
    var options = {
      apiMode: 2,
      port: '/dev/null',
      baud: 9600,
      callback: function (e, message) {}
    }
    return XBee.create(VirtualSerialPort, XBeeAPI, options).then(function (x) {
      xbee = x
    })
  })

  describe('XBee#create', function () {
    it('rejects if port is invalid', function () {
      options.port = null
      return expect(XBee.create(SerialPort, XBeeAPI, options))
      .to.eventually.be.rejectedWith('Bad or missing arguments')
    })

    it('rejects if baud is invalid', function () {
      options.baud = 'invalid'
      return expect(XBee.create(SerialPort, XBeeAPI, options))
      .to.eventually.be.rejectedWith('Invalid "baudRate"')
    })

    it('rejects if apiMode is invalid', function () {
      options.apiMode = 'invalid'
      return expect(XBee.create(SerialPort, XBeeAPI, options))
      .to.eventually.be.rejectedWith('Invalid API mode')
    })

    it('rejects if callback is invalid', function () {
      options.callback = null
      return expect(XBee.create(SerialPort, XBeeAPI, options))
      .to.eventually.be.rejectedWith('Bad or missing callback')
    })

    it('creates an instance of XBee', function () {
      return XBee.create(VirtualSerialPort, XBeeAPI, options).then(function (xbee) {
        expect(xbee).to.be.instanceof(XBee)
      })
    })

    it('rejects if serial port cannot be opened', function () {
      return expect(XBee.create(SerialPort, XBeeAPI, options))
      .to.eventually.be.rejectedWith('Unknown error code 3')
    })

    it('opens the serial port', function () {
      return XBee.create(VirtualSerialPort, XBeeAPI, options).then(function (xbee) {
        expect(xbee.serialport.isOpen()).to.be.true
      })
    })

    it('should call callback with Error on XBee error', function (done) {
      options.callback = function (error, message) {
        expect(error).to.be.instanceof(Error)
        expect(error).to.have.property('message', 'test')
        done()
      }
      XBee.create(VirtualSerialPort, XBeeAPI, options).then(function (xbee) {
        xbee.xbeeAPI.emit('error', Error('test'))
      })
    })

    it('should call messageCallback with XBee frame', function (done) {
      options.callback = function (error, frame) {
        expect(error).to.be.null
        expect(frame).to.equal('test-frame')
        done()
      }
      XBee.create(VirtualSerialPort, XBeeAPI, options).then(function (xbee) {
        xbee.xbeeAPI.emit('frame_object', 'test-frame')
      })
    })
  })

  describe('XBee#transmitMqttMessage', function () {
    it('rejects if message is not JSON', function () {
      return expect(xbee.transmitMqttMessage('this-is-not-json'))
      .to.eventually.be.rejectedWith('Unexpected token')
    })

    it('rejects if message is not an API frame', function () {
      var badFrame = '{"type": "invalid"}'
      return expect(xbee.transmitMqttMessage(badFrame))
      .to.eventually.be.rejectedWith('does not implement building')
    })

    it('should accept valid xbee-api frames', function () {
      var standardFrame = '{"type":9, "id":1, "command":"BD", "commandParameter":[7]}'
      var typeHex = '{"type":"0x09", "id":1, "command":"BD", "commandParameter":[7]}'
      var idHex = '{"type":9, "id":"0x01", "command":"BD", "commandParameter":[7]}'
      var noCP = '{"type":9, "id":1, "command":"BD"}'
      return Promise.all([
        xbee.transmitMqttMessage(standardFrame),
        xbee.transmitMqttMessage(typeHex),
        xbee.transmitMqttMessage(idHex),
        xbee.transmitMqttMessage(noCP)
      ])
    })
  })

  describe('XBee#transmit', function () {
    it('should reject if frame is invalid', function () {
      return expect(xbee.transmit()).to.eventually.be.rejectedWith('Invalid frame')
    })

    xit('resolves with a response', function () {
      // TODO: figure out how to get the fake serial port to respond with a frame
      var sp = new SerialPort('/dev/fake')
      var testFrame = {
        type: 0x08,
        command: 'ID',
        commandParameter: []
      }
      var testXBeeApi = new XBeeAPI.XBeeAPI({api_mode: 2})
      var testBee = new XBee(sp, testXBeeApi)
      testBee.transmit(testFrame)
    })

    it('should reject on timeout', function () {
      var testFrame = {
        type: 0x08,
        command: 'ID',
        commandParameter: []
      }
      return expect(xbee.transmit(testFrame, 10)).to.eventually.be.rejectedWith('XBee not responding')
    })

    it('should reject on serial port error', function () {
      var sp = new SerialPort('/dev/fake')
      var testFrame = {
        type: 0x08,
        command: 'ID',
        commandParameter: []
      }
      var testXBeeApi = new XBeeAPI.XBeeAPI({api_mode: 2})
      var testBee = new XBee(sp, testXBeeApi)
      return expect(testBee.transmit(testFrame)).to.eventually.be.rejectedWith('Port is not open')
    })
  })

  describe('xbee.getLocalAddress()', function () {
    xit('should resolve with an address string', function () {

    })

    xit('reject on error', function () {

    })
  })

  describe('xbee.getLocalNI()', function () {
    xit('should resolve with a node-identifier string', function () {

    })

    xit('should reject on error', function () {

    })
  })
})
