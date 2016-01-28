var Mqtt = require('mqtt');

module.exports = {
    begin: begin,
    end: end,
    publishXBeeFrame: publishXBeeFrame,
    publishLog: publishLog
};

var mqtt;
var rootTopic;

/*
 * Start the MQTT client, establish LWT, subscribe to the request topic,
 * and listen for incoming messages.
 */
function begin(broker, topic, messageCallback, connectedCallback) {
    if (!topic)
        throw new ReferenceError("Invalid root topic.");
    if (!broker)
        throw new ReferenceError("Invalid broker.");

    rootTopic = topic;

    /*
     * Use the same options as the Java version of XBMQ.
     */
    var mqttOptions = {
        clientId: 'node-xbmq-' + Math.random().toString(16).substr(2, 8),
        clean: false,
        keepalive: 60,
        reconnectPeriod: 15000,
        will: {
            topic: rootTopic + '/online',
            payload: '0',
            qos: 0,
            retain: true
        }
    };

    mqtt = Mqtt.connect(broker, mqttOptions);

    mqtt.on('reconnect', function () {
        /*
         * Emitted when a reconnection starts.
         */
        console.log("Reconnecting.");
    });

    mqtt.on('close', function () {
        /*
         * Emitted after the client has disconnected from the broker.
         */
        console.log("Closing.");
    });

    mqtt.on('offline', function () {
        /*
         * Emitted when the client goes offline. 
         */
        console.log("Offline");
    });

    mqtt.on('connect', function (connack) {
        console.log("Connected");
        publishOnlineStatus(true);
        if (connack.sessionPresent) {
            /* This is a reconnect.  No need to re-subscribe or
             * call the callback.
             */
            console.log("Using existing session.");
            return;
        }
        mqtt.subscribe(rootTopic + '/request', null, function (error) {
            if (error) {
                return messageCallback(error);
            }
        });

        if (connectedCallback) {
            connectedCallback();
        }
    });

    mqtt.on('error', function (error) {
        console.log(error);
        return messageCallback(error, null, null);
    });

    mqtt.on('message', function (topic, message) {
        console.log('Received: ' + topic + ': ' + message);
        return messageCallback(null, topic, message.toString());
    });

}

/**
 * Close the MQTT client.  Does nothing if the client is not open.
 * @param {function} callback - Function called once the MQTT client has closed.
 */
function end(callback) {
    if (mqtt) {
        publishOnlineStatus(false);
        mqtt.end(false, function () {
            mqtt = null;
            rootTopic = null;
            if (callback) {
                callback();
            }
        });

    }
}

/**
 * Publish XBMQ Gateway's online status to the `online` topic.  Will publish
 * "1" when online or "0" when offline.
 * @param {Boolean} isOnline - true for online, false for offline
 *
 */
function publishOnlineStatus(isOnline) {
    var message = isOnline ? '1' : '0';
    var topic = rootTopic + '/online';
    mqtt.publish(topic, message);
}

/**
 * Publish an XBee API frame to the `response` topic.
 * @param {type} frame - XBee API Frame object.
 * @throws {ReferenceError} - If begin() not called or rootTopic is false.
 * @throws {ReferenceError} - If frame is invalid or has no remote64 address.
 */
function publishXBeeFrame(frame) {
    if (!mqtt || !rootTopic)
        throw new ReferenceError("Calling publishXBeeFrame() before begin().");
    if (!frame || !frame.remote64)
        throw new ReferenceError("Invalid frame.");

    var topic = rootTopic + "/" + frame.remote64 + '/response';
    var message = JSON.stringify(frame);
    mqtt.publish(topic, message);
}

/**
 * Publish a message to the `log` topic.
 * @param {type} message - The string or Error to be published.
 * @throws {ReferenceError}  - If begin() not called or rootTopic is false.
 * @throws {TypeError} - If message is not an Error or a string.
 */
function publishLog(message) {
    if (!mqtt || !rootTopic)
        throw new ReferenceError("Calling publishLog() before begin().");
    if (!message instanceof Error)
        throw new TypeError("Mesage must be an Error or a String.");

    var topic = rootTopic + '/log';
    mqtt.publish(topic, message.message || message);
}