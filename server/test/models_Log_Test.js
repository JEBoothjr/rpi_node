/*jslint node: true */
'use strict';

var request,
    app,
    async = require('async'),
    sinon = require('sinon'),
    should = require('should'),
    common = require('./lib/common'),
    LogModel = require('../models/Log'),
    mock = require('./lib/mock');

before(function(done) {

    common.before(function(params) {
        app = params.app;
        request = params.request;
        done();
    });
});

describe("Log Model", function() {
    describe("Creating a log", function() {

        beforeEach(function(done) {
            common.resetDatabase(function() {
                done();
            });
        });

        it("Should create a log", function(done) {
            var logModel = new LogModel(),
                data = {
                    name: "Rose"
                };

            logModel.create(data, function(err, result) {
                try {
                    should.equal(err, null);
                    result.should.have.property("id");
                    done();
                } catch (e) {
                    done(e);
                }
            });
        });

        it("Should handle an error from the database when creating log", function(done) {
            var logModel = new LogModel(),
                stub = sinon.stub(logModel.client, 'execute', function(query, params, options, callback) {
                    callback(true);
                }),
                data = {
                    name: "Rose"
                };

            logModel.create(data, function(err, result) {
                stub.restore();

                try {
                    should.exist(err);
                    should.equal(result, null);
                    done();
                } catch (e) {
                    done(e);
                }
            });
        });
    });
    describe("Finding a log", function() {

        beforeEach(function(done) {
            common.resetDatabase(function() {
                done();
            });
        });

        it("Should find a log by id", function(done) {
            var logModel = new LogModel(),
                data = {
                    name: "Rose"
                },
                logId;

            async.series({
                create: function(callback) {
                    logModel.create(data, function(err, result) {
                        logId = result.id;
                        callback(err, result);
                    });
                },
                find: function(callback) {
                    logModel.findById(logId, function(err, result) {
                        callback(err, result);
                    });
                }
            }, function(err, result) {
                try {
                    should.equal(err, null);
                    result.find.should.have.property("id");
                    result.find.should.have.property("name", "Rose");
                    should.equal(result.find.id, logId);
                    done();
                } catch (e) {
                    done(e);
                }
            });
        });

        it("Should not find a log by an id that doesn't exist", function(done) {
            var logModel = new LogModel();

            logModel.findById('31927de0-895f-11e4-a766-379b8cabc123', function(err, result) {
                try {
                    should.equal(err, null);
                    should.equal(result, null);
                    done();
                } catch (e) {
                    done(e);
                }
            });
        });

        it("Should handle an error from the database when finding a log by id", function(done) {
            var logModel = new LogModel(),
                stub = sinon.stub(logModel.client, 'execute', function(query, params, options, callback) {
                    callback(true);
                });

            logModel.findById('31927de0-895f-11e4-a766-379b8cabc123', function(err, result) {
                stub.restore();

                try {
                    should.exist(err);
                    should.equal(result, null);
                    done();
                } catch (e) {
                    done(e);
                }
            });
        });
    });
    describe("Updating a log", function() {

        beforeEach(function(done) {
            common.resetDatabase(function() {
                done();
            });
        });

        it("Should update a log", function(done) {
            var logModel = new LogModel(),
                data = {
                    name: "Rose"
                },
                newData = {
                    name: "Orchid"
                },
                logId;

            async.series({
                create: function(callback) {
                    logModel.create(data, function(err, result) {
                        logId = newData.id = result.id;
                        callback(err, result);
                    });
                },
                update: function(callback) {
                    logModel.update(newData, function(err, result) {
                        callback(err, result);
                    });
                }
            }, function(err, result) {

                try {
                    should.equal(err, null);
                    result.update.should.have.property("id");
                    should.equal(result.update.id, logId);
                    done();
                } catch (e) {
                    done(e);
                }
            });
        });

        it("Should handle an error from the database when updating log", function(done) {
            var logModel = new LogModel(),
                stub = sinon.stub(logModel.client, 'execute', function(query, params, options, callback) {
                    callback(true);
                }),
                data = {
                    name: "Rose"
                };

            logModel.update(data, function(err, result) {
                stub.restore();

                try {
                    should.exist(err);
                    should.equal(result, null);
                    done();
                } catch (e) {
                    done(e);
                }
            });
        });
    });
    describe("Deleting a log", function() {

        beforeEach(function(done) {
            common.resetDatabase(function() {
                done();
            });
        });

        it("Should delete a log", function(done) {
            var logModel = new LogModel(),
                data = {
                    name: "Rose"
                },
                logId;

            async.series({
                create: function(callback) {
                    logModel.create(data, function(err, result) {
                        logId = result.id;
                        callback(err, result);
                    });
                },
                remove: function(callback) {
                    logModel.delete(logId, function(err, result) {
                        callback(err, result);
                    });
                },
                find: function(callback) {
                    logModel.findById(logId, function(err, result) {
                        callback(err, result);
                    });
                }
            }, function(err, result) {
                try {
                    should.equal(err, null);
                    should.equal(result.remove, null);
                    should.equal(result.find, null);
                    done();
                } catch (e) {
                    done(e);
                }
            });
        });

        it("Should handle an error from the database when deleting log", function(done) {
            var logModel = new LogModel(),
                stub = sinon.stub(logModel.client, 'execute', function(query, params, options, callback) {
                    callback(true);
                });

            logModel.delete("abc123", function(err, result) {
                stub.restore();

                try {
                    should.exist(err);
                    should.equal(result, null);
                    done();
                } catch (e) {
                    done(e);
                }
            });
        });
    });
    describe("Finding all logs", function() {

        beforeEach(function(done) {
            common.resetDatabase(function() {
                done();
            });
        });

        it("Should find all logs", function(done) {
            var logModel = new LogModel(),
                total = 25,
                count = 0;

            async.whilst(
                function() {
                    return count < total;
                },
                function(callback) {
                    count++;
                    mock.createLog(callback);
                },
                function(err) {
                    logModel.findAll(function(err, result) {
                        try {
                            should.equal(err, null);
                            should.exist(result);
                            should.equal(result.length, total);
                            done();
                        } catch (e) {
                            done(e);
                        }
                    });
                }
            );
        });

        it("Should find no logs", function(done) {
            var logModel = new LogModel();

            logModel.findAll(function(err, result) {
                try {
                    should.equal(err, null);
                    should.exist(result);
                    should.equal(result.length, 0);
                    done();
                } catch (e) {
                    done(e);
                }
            });
        });

        it("Should handle an error from the database when retrieving all logs", function(done) {
            var logModel = new LogModel(),
                stub = sinon.stub(logModel.client, 'execute', function(query, params, options, callback) {
                    callback(true);
                });

            logModel.findAll(function(err, result) {
                stub.restore();

                try {
                    should.exist(err);
                    should.equal(result, null);
                    done();
                } catch (e) {
                    done(e);
                }
            });
        });
    });
});