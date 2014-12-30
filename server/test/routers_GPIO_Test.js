/*jslint node: true */
'use strict';

var request,
    app,
    async = require('async'),
    sinon = require('sinon'),
    should = require('should'),
    common = require('./lib/common'),
    gpio = require('rpi-gpio'),
    LogModel = require('../models/Log'),
    gpioServices = require('../services/GPIO').GPIOService,
    mock = require('./lib/mock');

before(function(done) {

    common.before(function(params) {
        app = params.app;
        request = params.request;
        done();
    });
});

describe("GPIO Router", function() {
    describe("Getting Channel Value", function() {
        beforeEach(function(done) {

            common.resetDatabase(function() {
                done();
            });
        });

        it("Should find a channel value", function(done) {
            var stub = sinon.stub(gpio, 'read', function(channel, callback) {
                    callback(null, true);
                }),
                setupStub = sinon.stub(gpio, 'setup', function(channel, direction, callback) {
                    callback(null, true);
                });

            request(app).get('/api/gpio/7')
                .end(function(err, res) {
                    stub.restore();
                    setupStub.restore();

                    try {
                        should.equal(err, null);
                        res.status.should.equal(200);
                        res.body.should.have.property("channel");
                        res.body.should.have.property("channel", "7");
                        res.body.should.have.property("value");
                        res.body.should.have.property("value", true);
                        done();
                    } catch (e) {
                        done(e);
                    }
                });
        });

        it("Should handle an invalid channel", function(done) {
            var stub = sinon.stub(gpio, 'read', function(channel, callback) {
                    callback(null, true);
                }),
                setupStub = sinon.stub(gpio, 'setup', function(channel, direction, callback) {
                    callback(null, true);
                });

            request(app).get('/api/gpio/2')
                .end(function(err, res) {
                    stub.restore();
                    setupStub.restore();

                    try {
                        should.equal(err, null);
                        res.status.should.equal(404);
                        res.body.should.equal("Invalid Channel, 2");
                        done();
                    } catch (e) {
                        done(e);
                    }
                });
        });
    });

    describe("Updating a Channel Value", function() {
        beforeEach(function(done) {

            common.resetDatabase(function() {
                done();
            });
        });

        it("Should update a channel value to true (1)", function(done) {
            var stub = sinon.stub(gpio, 'write', function(channel, value, callback) {
                    callback(null, true);
                }),
                setupStub = sinon.stub(gpio, 'setup', function(channel, direction, callback) {
                    callback(null, true);
                });

            request(app).put('/api/gpio/7/1')
                .end(function(err, res) {
                    stub.restore();
                    setupStub.restore();

                    try {
                        should.equal(err, null);
                        res.status.should.equal(200);
                        res.body.should.have.property("channel");
                        res.body.should.have.property("channel", "7");
                        res.body.should.have.property("value");
                        res.body.should.have.property("value", true);
                        done();
                    } catch (e) {
                        done(e);
                    }
                });
        });

        it("Should update a channel value to true (true)", function(done) {
            var stub = sinon.stub(gpio, 'write', function(channel, value, callback) {
                    callback(null, true);
                }),
                setupStub = sinon.stub(gpio, 'setup', function(channel, direction, callback) {
                    callback(null, true);
                });

            request(app).put('/api/gpio/7/true')
                .end(function(err, res) {
                    stub.restore();
                    setupStub.restore();

                    try {
                        should.equal(err, null);
                        res.status.should.equal(200);
                        res.body.should.have.property("channel");
                        res.body.should.have.property("channel", "7");
                        res.body.should.have.property("value");
                        res.body.should.have.property("value", true);
                        done();
                    } catch (e) {
                        done(e);
                    }
                });
        });

        it("Should update a channel value to false (0)", function(done) {
            var stub = sinon.stub(gpio, 'write', function(channel, value, callback) {
                    callback(null, true);
                }),
                setupStub = sinon.stub(gpio, 'setup', function(channel, direction, callback) {
                    callback(null, true);
                });

            request(app).put('/api/gpio/7/0')
                .end(function(err, res) {
                    stub.restore();
                    setupStub.restore();

                    try {
                        should.equal(err, null);
                        res.status.should.equal(200);
                        res.body.should.have.property("channel");
                        res.body.should.have.property("channel", "7");
                        res.body.should.have.property("value");
                        res.body.should.have.property("value", false);
                        done();
                    } catch (e) {
                        done(e);
                    }
                });
        });

        it("Should update a channel value to false (false)", function(done) {
            var stub = sinon.stub(gpio, 'write', function(channel, value, callback) {
                    callback(null, true);
                }),
                setupStub = sinon.stub(gpio, 'setup', function(channel, direction, callback) {
                    callback(null, true);
                });

            request(app).put('/api/gpio/7/0')
                .end(function(err, res) {
                    stub.restore();
                    setupStub.restore();

                    try {
                        should.equal(err, null);
                        res.status.should.equal(200);
                        res.body.should.have.property("channel");
                        res.body.should.have.property("channel", "7");
                        res.body.should.have.property("value");
                        res.body.should.have.property("value", false);
                        done();
                    } catch (e) {
                        done(e);
                    }
                });
        });

        it("Should handle an invalid channel", function(done) {
            var stub = sinon.stub(gpio, 'write', function(channel, callback) {
                    callback(null, true);
                }),
                setupStub = sinon.stub(gpio, 'setup', function(channel, direction, callback) {
                    callback(null, true);
                });

            request(app).put('/api/gpio/2/0')
                .end(function(err, res) {
                    stub.restore();
                    setupStub.restore();

                    try {
                        should.equal(err, null);
                        res.status.should.equal(404);
                        res.body.should.equal("Invalid Channel, 2");
                        done();
                    } catch (e) {
                        done(e);
                    }
                });
        });
    });
});