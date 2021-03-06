/*jslint node: true */
'use strict';

var config = require('config'),
    gpio = require('rpi-gpio'),
    async = require('async'),
    ServerError = require('../lib/Error').ServerError,
    logService = require('./Log').LogService,
    logger = require('../lib/Logger');

function GPIOService() {
    this.CHANNELS = config.get('gpio.channels');

    // gpio.on('change', function(channel, value) {
    //     logService.create({
    //         name: "CHANNEL_CHANGE",
    //         description: "Channel " + channel + " = " + value
    //     }, function(err) {
    //         if (!err) {
    //             logger.info("Channel " + channel + " = " + value);
    //         }
    //     });
    // });

    this.read = function(channel, callback) {

        if (this.CHANNELS.indexOf(channel) === -1) {
            return callback(new ServerError(404, "Invalid Channel, " + channel, channel));
        }

        async.waterfall([
            function(callback) {
                gpio.setup(channel, gpio.DIR_IN, function(err) {
                    if (err) {
                        err = new ServerError(500, "Error in channel read setup, " + channel, channel, err);
                    }
                    callback(err);
                });
            },
            function(callback) {
                gpio.read(channel, function(err, value) {
                    if (err) {
                        err = new ServerError(500, "Error reading channel, " + channel, channel, err);
                    }
                    callback(err, value);
                });
            },
            function(value, callback) {
                logService.create({
                    name: "CHANNEL_READ",
                    description: "Channel " + channel + " = " + value
                }, function(err) {
                    if (err) {
                        err = new ServerError(500, "Error logging channel read, " + channel, channel, err);
                    }
                    callback(err, value);
                });
            },
            function(value, callback) {
                setTimeout(function() {
                    gpio.destroy(function(err) {
                        if (err) {
                            err = new ServerError(500, "Error destroying read, " + channel, channel, err);
                        }
                        callback(err, value);
                    });
                }, 500);
            }
        ], function(err, result) {
            if (err) {
                return callback(err);
            }

            logger.info("Channel " + channel + " = " + result);
            callback(null, {
                channel: channel,
                value: result
            });
        });
    };

    this.update = function(channel, value, callback) {

        if (this.CHANNELS.indexOf(channel) === -1) {
            return callback(new ServerError(404, "Invalid Channel, " + channel, channel));
        }

        async.series({
            init: function(callback) {
                gpio.setup(channel, gpio.DIR_OUT, function(err) {
                    if (err) {
                        err = new ServerError(500, "Error in channel write setup, " + channel, channel, err);
                    }
                    callback(err);
                });
            },
            update: function(callback) {
                gpio.write(channel, value, function(err) {
                    if (err) {
                        err = new ServerError(500, "Error updating channel, " + channel + "=" + value, channel, err);
                    }
                    callback(err);
                });
            },
            log: function(callback) {
                logService.create({
                    name: "CHANNEL_UPDATE",
                    description: "Channel " + channel + " value is now " + value
                }, function(err) {
                    if (err) {
                        err = new ServerError(500, "Error logging channel update, " + channel + "=" + value, channel, err);
                    }
                    callback(err);
                });
            },
            clean: function(callback) {
                setTimeout(function() {
                    gpio.destroy(function(err) {
                        if (err) {
                            err = new ServerError(500, "Error destroying write, " + channel, channel, err);
                        }
                        callback(err);
                    });
                }, 500);
            }
        }, function(err) {
            if (!err) {
                logger.info("Channel " + channel + " value is now " + value);
            }
            callback(err, {
                channel: channel,
                value: value
            });
        });
    };
}

exports.GPIOService = new GPIOService();