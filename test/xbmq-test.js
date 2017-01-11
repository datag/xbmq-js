/* global describe it before after */
var assert = require('assert')
var sinon = require('sinon')
var mockery = require('mockery')

var xbmq
var mqttStub
var xbeeStub

describe('xbmq.js', function () {
  before(function () {
    mqttStub = {
      publishLog: sinon.stub(),
      publishXBeeFrame: sinon.stub(),
      isConnected: function () { return true }
    }

    xbeeStub = {
      begin: sinon.stub(),
      transmitMqttMessage: sinon.stub()
    }

    mockery.enable({
      warnOnUnregistered: false,
      warnOnReplace: false
    })
    mockery.registerMock('./mqtt', mqttStub)
    mockery.registerMock('./xbee', xbeeStub)
    xbmq = require('../xbmq')
  })

  after(function () {
    mockery.disable()
  })

  describe('whenXBeeMessageReceived', function () {
    it('it calls mqtt.publishLog() on error', function () {
      mqttStub.publishLog.reset()
      xbmq.whenXBeeMessageReceived(' ', null, null)
      sinon.assert.calledOnce(mqttStub.publishLog)
    })

    it('it calls mqtt.publishXBeeFrame();', function () {
      mqttStub.publishXBeeFrame.reset()
      xbmq.whenXBeeMessageReceived(null, 'topic', 'message')
      sinon.assert.calledOnce(mqttStub.publishXBeeFrame)
    })

    it('does not call mqtt.publishXBeeFrame() on error', function () {
      mqttStub.publishXBeeFrame.reset()
      xbmq.whenXBeeMessageReceived(' ', 'topic', 'message')
      sinon.assert.notCalled(mqttStub.publishXBeeFrame)
    })
  })

  describe('whenMqttMessageReceived', function () {
    it('it does not call mqtt.publishLog() on error', function () {
      mqttStub.publishLog.reset()
      xbmq.whenMqttMessageReceived(' ', null, null)
      assert(!mqttStub.publishLog.called)
    })

    it('it calls xbee.transmitMqttMessage()', function () {
      xbeeStub.transmitMqttMessage.reset()
      xbmq.whenMqttMessageReceived(null, 'topic', 'message')
      sinon.assert.calledOnce(xbeeStub.transmitMqttMessage)
    })

    it('does not call xbee.transmitMqttMessage() on error', function () {
      xbeeStub.transmitMqttMessage.reset()
      xbmq.whenMqttMessageReceived(' ', 'topic', 'message')
      sinon.assert.notCalled(xbeeStub.transmitMqttMessage)
    })
  })
})
