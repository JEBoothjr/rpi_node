/*jslint node: true */
'use strict';

var config = require('config'),
    GPIO = require('onoff').Gpio,
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
            this.outputs_gpios[output] = new GPIO(output, 'out');
        }
        for (i = 0; i < inputs_len; i++) {
            input = this.INPUTS[i];
            this.outputs_gpios[input] = new GPIO(input, 'in', 'both');
        }

        callback();
    };

    this.read = function(num, callback) {
        var self = this,
            cur_gpio;

        async.waterfall([
            function(callback) {
                self.initialize(callback);
            },
            function(callback) {
                console.log(this.input_gpios);
                console.log(this.outputs_gpios);

                cur_gpio = this.input_gpios[num] || this.outputs_gpios[num];
                if (!cur_gpio) {
                    return callback(new ServerError(404, "Unknown GPIO Number, " + num, num));
                }

                callback();
            },
            function(callback) {
                cur_gpio.read(function(err, result) {
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
        var self = this,
            cur_gpio;

        async.series({
            init: function(callback) {
                self.initialize(callback);
            },
            varify: function(callback) {
                console.log(this.input_gpios);
                console.log(this.outputs_gpios);

                cur_gpio = this.outputs_gpios[num];
                if (!cur_gpio) {
                    return callback(new ServerError(404, "Unknown GPIO Number, " + num, num));
                }

                callback();
            },
            update: function(callback) {
                cur_gpio.write(value, function(err) {
                    if (err) {
                        err = new ServerError(500, "Error updating GPIO, " + num + "=" + value, num, err);
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
        }, function(err) {
            if (!err) {
                logger.info("GPIO " + num + " value is now " + value);
            }
            callback(err, {
                gpio: num,
                value: value
            });
        });
    };

    this.dispose = function() {
        console.log("DISPOSE");
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
    };
}

exports.GPIOService = new GPIOService();