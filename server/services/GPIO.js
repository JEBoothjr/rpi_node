/*jslint node: true */
'use strict';

var config = require('config'),
    GPIO = require('../lib/RasPi_GPIO'),
    async = require('async'),
    ServerError = require('../lib/Error').ServerError,
    logService = require('./Log').LogService,
    logger = require('../lib/Logger');

function GPIOService() {
    this.INPUTS = config.get('gpio.inputs');
    this.OUTPUTS = config.get('gpio.outputs');
    this.initialized = false;
    this.input_gpios = {};
    this.outputs_gpios = {};

    //TODO : Call from app.js startup?
    this.initialize = function(callback) {
        var input,
            inputs_len = this.INPUTS.length,
            output,
            outputs_len = this.OUTPUTS.length,
            i;

        if (this.initialized) {
            return callback();
        }

        for (i = 0; i < outputs_len; i++) {
            output = this.OUTPUTS[i];
            this.outputs_gpios[output] = new GPIO(output, {
                direction: 'out'
            });
        }
        for (i = 0; i < inputs_len; i++) {
            input = this.INPUTS[i];
            this.outputs_gpios[input] = new GPIO(input, {
                direction: 'in'
            });
        }

        callback();
    };

    this.read = function(num, callback) {
        var self = this;

        async.waterfall([
            function(callback) {
                self.initialize(callback);
            },
            function(callback) {
                self.cur_gpio = self.input_gpios[num] || self.outputs_gpios[num];
                if (!self.cur_gpio) {
                    return callback(new ServerError(404, "Unknown GPIO Number, " + num, num));
                }

                callback();
            },
            function(callback) {
                self.cur_gpio.read(function(err, result) {
                    if (err) {
                        err = new ServerError(500, "Error reading gpio, " + num, num, err);
                    }
                    callback(err, result);
                });
            },
            function(value, callback) {
                logService.create({
                    name: "GPIO_READ",
                    description: "GPIO " + num + " = " + value
                }, function(err) {
                    if (err) {
                        err = new ServerError(500, "Error logging gpio read, " + num, num, err);
                    }
                    callback(err, value);
                });
            }
        ], function(err, result) {
            if (err) {
                return callback(err);
            }

            logger.info("GPIO " + num + " = " + result);
            callback(null, {
                gpio: num,
                value: result
            });
        });
    };

    this.update = function(num, value, callback) {
        var self = this;

        async.series({
            init: function(callback) {
                self.initialize(callback);
            },
            verify: function(callback) {
                self.cur_gpio = self.outputs_gpios[num];
                if (!self.cur_gpio) {
                    return callback(new ServerError(404, "Unknown GPIO Number, " + num, num));
                }

                callback();
            },
            update: function(callback) {
                self.cur_gpio.write(value, function(err) {
                    if (err) {
                        err = new ServerError(500, "Error updating GPIO, " + num + "=" + value, num, err);
                    }
                    callback(err);
                });
            },
            read: function(callback) {
                self.cur_gpio.read(function(err, result) {
                    if (err) {
                        err = new ServerError(500, "Error reading gpio, " + num, num, err);
                    }
                    callback(err);
                });
            },
            log: function(callback) {
                logService.create({
                    name: "GPIO_UPDATE",
                    description: "GPIO " + num + " value is now " + value
                }, function(err) {
                    if (err) {
                        err = new ServerError(500, "Error logging GPIO update, " + num + "=" + value, num, err);
                    }
                    callback(err);
                });
            }
        }, function(err, result) {
            if (!err) {
                logger.info("GPIO " + num + " value is now " + result.read);
            }
            callback(err, {
                gpio: num,
                value: result.read
            });
        });
    };

    this.dispose = function() {
        var cur_gpio,
            input,
            inputs_len = this.INPUTS.length,
            output,
            outputs_len = this.OUTPUTS.length,
            i;

        for (i = 0; i < outputs_len; i++) {
            output = this.OUTPUTS[i];
            cur_gpio = this.outputs_gpios[output];
            if (cur_gpio) {
                cur_gpio.unexport();
            }
        }
        for (i = 0; i < inputs_len; i++) {
            input = this.INPUTS[i];
            cur_gpio = this.input_gpios[input];
            if (cur_gpio) {
                cur_gpio.unexport();
            }
        }

        this.INPUTS = [];
        this.OUTPUTS = [];
    };
}

exports.GPIOService = new GPIOService();