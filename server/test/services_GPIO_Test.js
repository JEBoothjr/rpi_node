/*jslint node: true */
'use strict';

var request,
    app,
    fs = require('fs'),
    async = require('async'),
    sinon = require('sinon'),
    should = require('should'),
    common = require('./lib/common'),
    GPIO = require('onoff').Gpio,
    LogModel = require('../models/Log'),
    gpioServices = require('../services/GPIO').GPIOService,
    logServices = require('../services/Log').LogService,
    mock = require('./lib/mock');

before(function(done) {
    common.before(function(params) {
        app = params.app;
        request = params.request;
        done();
    });
});

describe("GPIO Service", function() {

    describe("Getting GPIO Value", function() {

        beforeEach(function(done) {

            common.resetDatabase(function() {
                done();
            });
        });

        it("Should find a GPIO value", function(done) {
            var fsStub1 = sinon.stub(fs, 'existsSync', function(path) {
                    return false;
                }),
                fsStub2 = sinon.stub(fs, 'writeFileSync', function(path) {
                    return true;
                }),
                fsStub3 = sinon.stub(fs, 'chmodSync', function(path) {
                    return true;
                }),
                fsStub4 = sinon.stub(fs, 'openSync', function(path) {
                    return true;
                }),
                fsStub5 = sinon.stub(fs, 'readSync', function(path) {
                    return true;
                }),
                fsStub6 = sinon.stub(fs, 'closeSync', function(path) {
                    return true;
                }),
                fsStub7 = sinon.stub(GPIO.prototype, 'read', function(callback) {
                    callback(1);
                }),
                fsStub8 = sinon.stub(gpioServices, 'dispose', function() {

                });

            gpioServices.read(7, function(err, result) {
                fsStub1.restore();
                fsStub2.restore();
                fsStub3.restore();
                fsStub4.restore();
                fsStub5.restore();
                fsStub6.restore();
                fsStub7.restore();
                //fsStub8.restore();

                try {
                    should.equal(err, null);
                    should.exist(result);
                    result.should.have.property("gpio");
                    should.equal(result.channel, 7);
                    result.should.have.property("value");
                    should.equal(result.value, true);
                    done();
                } catch (e) {
                    done(e);
                }
            });
        });

        it("Should handle log fail on GPIO setup", function(done) {
            var stub = sinon.stub(gpio, 'read', function(channel, callback) {
                    callback(null, true);
                }),
                setupStub = sinon.stub(gpio, 'setup', function(channel, direction, callback) {
                    callback(true, null);
                });

            gpioServices.read(7, function(err, result) {
                stub.restore();
                setupStub.restore();

                try {
                    (err.status).should.equal(500);
                    (err.message).should.equal("Error in channel read setup, 7");
                    done();
                } catch (e) {
                    done(e);
                }
            });
        });

        it("Should fail for unsupported channel", function(done) {
            var stub = sinon.stub(gpio, 'read', function(channel, callback) {
                    callback(null, true);
                }),
                setupStub = sinon.stub(gpio, 'setup', function(channel, direction, callback) {
                    callback(null, true);
                });

            gpioServices.read(2, function(err, result) {
                stub.restore();
                setupStub.restore();

                try {
                    (err.status).should.equal(404);
                    (err.message).should.equal("Invalid Channel, 2");
                    done();
                } catch (e) {
                    done(e);
                }
            });
        });

        it("Should handle channel read failure", function(done) {
            var stub = sinon.stub(gpio, 'read', function(channel, callback) {
                    callback(true, null);
                }),
                setupStub = sinon.stub(gpio, 'setup', function(channel, direction, callback) {
                    callback(null, true);
                });

            gpioServices.read(7, function(err, result) {
                stub.restore();
                setupStub.restore();

                try {
                    (err.status).should.equal(500);
                    (err.message).should.equal("Error reading channel, 7");
                    done();
                } catch (e) {
                    done(e);
                }
            });
        });

        it("Should handle log fail on channel read", function(done) {
            var stub = sinon.stub(gpio, 'read', function(channel, callback) {
                    callback(null, true);
                }),
                setupStub = sinon.stub(gpio, 'setup', function(channel, direction, callback) {
                    callback(null, true);
                }),
                logStub = sinon.stub(logServices, 'create', function(data, callback) {
                    callback(true, null);
                });

            gpioServices.read(7, function(err, result) {
                stub.restore();
                setupStub.restore();
                logStub.restore();

                try {
                    (err.status).should.equal(500);
                    (err.message).should.equal("Error logging channel read, 7");
                    done();
                } catch (e) {
                    done(e);
                }
            });
        });
    });

    describe("Updating Channel Value", function() {

        beforeEach(function(done) {

            common.resetDatabase(function() {
                done();
            });
        });

        it("Should update a channel value", function(done) {
            var stub = sinon.stub(gpio, 'write', function(channel, value, callback) {
                    callback(null, true);
                }),
                setupStub = sinon.stub(gpio, 'setup', function(channel, direction, callback) {
                    callback(null, true);
                });

            gpioServices.update(7, false, function(err, result) {
                stub.restore();
                setupStub.restore();

                try {
                    should.equal(err, null);
                    should.exist(result);
                    result.should.have.property("channel");
                    should.equal(result.channel, 7);
                    result.should.have.property("value");
                    should.equal(result.value, false);
                    done();
                } catch (e) {
                    done(e);
                }
            });
        });

        it("Should handle log fail on channel setup", function(done) {
            var stub = sinon.stub(gpio, 'write', function(channel, value, callback) {
                    callback(null, true);
                }),
                setupStub = sinon.stub(gpio, 'setup', function(channel, direction, callback) {
                    callback(true, null);
                });

            gpioServices.update(7, false, function(err, result) {
                stub.restore();
                setupStub.restore();

                try {
                    (err.status).should.equal(500);
                    (err.message).should.equal("Error in channel write setup, 7");
                    done();
                } catch (e) {
                    done(e);
                }
            });
        });

        it("Should fail for unsupported channel", function(done) {
            var stub = sinon.stub(gpio, 'write', function(channel, value, callback) {
                    callback(null, true);
                }),
                setupStub = sinon.stub(gpio, 'setup', function(channel, direction, callback) {
                    callback(null, true);
                });

            gpioServices.update(2, false, function(err, result) {
                stub.restore();
                setupStub.restore();

                try {
                    (err.status).should.equal(404);
                    (err.message).should.equal("Invalid Channel, 2");
                    done();
                } catch (e) {
                    done(e);
                }
            });
        });

        it("Should handle channel update failure", function(done) {
            var stub = sinon.stub(gpio, 'write', function(channel, value, callback) {
                    callback(true, null);
                }),
                setupStub = sinon.stub(gpio, 'setup', function(channel, direction, callback) {
                    callback(null, true);
                });

            gpioServices.update(7, false, function(err, result) {
                stub.restore();
                setupStub.restore();

                try {
                    (err.status).should.equal(500);
                    (err.message).should.equal("Error updating channel, 7=false");
                    done();
                } catch (e) {
                    done(e);
                }
            });
        });

        it("Should handle log fail on channel read", function(done) {
            var stub = sinon.stub(gpio, 'write', function(channel, value, callback) {
                    callback(null, true);
                }),
                setupStub = sinon.stub(gpio, 'setup', function(channel, direction, callback) {
                    callback(null, true);
                }),
                logStub = sinon.stub(logServices, 'create', function(data, callback) {
                    callback(true, null);
                });

            gpioServices.update(7, false, function(err, result) {
                stub.restore();
                setupStub.restore();
                logStub.restore();

                try {
                    (err.status).should.equal(500);
                    (err.message).should.equal("Error logging channel update, 7=false");
                    done();
                } catch (e) {
                    done(e);
                }
            });
        });
    });
});