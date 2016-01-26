var mqtt = require('../mqtt');
var expect = require('chai').expect;

describe('mqtt tests', function () {

    var broker = 'mqtt://test.mosquitto.org';
    var rootTopic = 'sdf987sdlk3jdjd';
    var Mqtt = require('mqtt');

    describe('begin tests', function () {

        var onlineTopic = rootTopic + '/online';

        it('should fail if rootTopic not given', function () {
            expect(function () {
                mqtt.begin(broker, null);
            }).to.throw(ReferenceError);
            mqtt.end();
        });

        it('should fail if broker not given', function () {
            expect(function () {
                mqtt.begin(null, rootTopic);
            }).to.throw(ReferenceError);
            mqtt.end();
        });
        
        it('should publish "1" to `online` topic', function (done) {
            var mqttClient = Mqtt.connect(broker);

            mqttClient.on('connect', function () {
                mqttClient.subscribe(onlineTopic);
                mqtt.begin(broker, rootTopic, null, null);
            });

            mqttClient.on('message', function (topic, message, packet) {
                if (!packet.retain) {
                    expect(topic).to.equal(onlineTopic);
                    expect("1").to.equal(message.toString());
                    mqtt.end(function () {
                        mqttClient.end(true, done);
                    });
                }
            });
        });

    });

    describe('publishXBeeFrame tests', function () {

        var responseTopic = rootTopic + '/1234/response';
        var testFrame = {
            remote64: '1234'
        };

        it('should fail if begin() not called', function () {
            expect(function () {
                mqtt.publishXBeeFrame(testFrame);
            }).to.throw(ReferenceError);

        });

        it('should fail if frame is invalid', function (done) {
            mqtt.begin(broker, rootTopic, null, function () {
                expect(function () {
                    mqtt.publishXBeeFrame();
                }).to.throw(ReferenceError);
                mqtt.end(done);
            });
        });

        it('should fail if frame is missing 64-bit address', function (done) {
            mqtt.begin(broker, rootTopic, null, function () {
                expect(function () {
                    mqtt.publishXBeeFrame();
                }).to.throw(ReferenceError);
                mqtt.end(done);
            });
        });

        it('should publish frame data to rootTopic/gateway/response', function (done) {
            var mqttClient = Mqtt.connect(broker);

            mqttClient.on('connect', function () {
                mqttClient.subscribe(responseTopic);
                mqtt.begin(broker, rootTopic, null, function () {
                    mqtt.publishXBeeFrame(testFrame);
                });
            });

            mqttClient.on('message', function (t, m) {
                var message = JSON.parse(m);
                expect(t).to.equal(responseTopic);
                expect(message).to.eql(testFrame);
                mqtt.end(function () {
                    mqttClient.end(done);
                });
            });

        });

    });

    describe('publishLog tests', function () {

        this.timeout(5000);
        var logTopic = rootTopic + '/log';

        it('should fail if begin() not called', function () {
            expect(function () {
                mqtt.publishLog('test message');
            }).to.throw(ReferenceError);

        });

        it('should fail if message is incorrect type', function (done) {
            mqtt.begin(broker, rootTopic, null, function () {
                expect(function () {
                    mqtt.publishLog(null);
                }).to.throw(TypeError);
                mqtt.end(done);
            });

        });

        it('should publish Errors as string to rootTopic/gateway/log', function (done) {
            var mqttClient = Mqtt.connect(broker);
            var error = new Error("Error message.");

            mqttClient.on('connect', function () {
                mqttClient.subscribe(logTopic);
                mqtt.begin(broker, rootTopic, null, function () {
                    mqtt.publishLog(error);
                });
            });

            mqttClient.on('message', function (t, m) {
                expect(t).to.equal(logTopic);
                expect(m.toString()).to.equal(error.message);
                mqtt.end(function () {
                    mqttClient.end(true, done);
                });
            });
        });

        it('should publish strings to rootTopic/gateway/log', function (done) {
            var mqttClient = Mqtt.connect(broker);
            var error = "Error message.";

            mqttClient.on('connect', function () {
                mqttClient.subscribe(logTopic);
                mqtt.begin(broker, rootTopic, null, function () {
                    mqtt.publishLog(error);
                });
            });

            mqttClient.on('message', function (t, m) {
                expect(t).to.equal(logTopic);
                expect(m.toString()).to.equal(error);
                mqtt.end(function () {
                    mqttClient.end(true, done);
                });
            });
        });

    });

});


