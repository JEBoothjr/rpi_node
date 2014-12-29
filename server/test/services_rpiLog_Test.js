/*jslint node: true */
'use strict';

var request,
    app,
    async = require('async'),
    sinon = require('sinon'),
    should = require('should'),
    common = require('./lib/common'),
    RPILogModel = require('../models/RPILog'),
    rpiLogServices = require('../services/RPILog').RPILogService,
    mock = require('./lib/mock');

before(function(done) {

    common.before(function(params) {
        app = params.app;
        request = params.request;
        done();
    });
});

describe("Log Service", function() {
    describe("Creating Logs", function() {

        beforeEach(function(done) {

            common.resetDatabase(function() {
                done();
            });
        });

        it("Should create a log", function(done) {
            var data = {
                name: "Rose"
            };

            rpiLogServices.create(data, function(err, result) {

                try {
                    should.equal(err, null);
                    should.exist(result);
                    result.should.have.property("id");
                    result.should.have.property("name", "Rose");
                    done();
                } catch (e) {
                    done(e);
                }
            });
        });
        it("Should handle error if model fails to create", function(done) {
            var data = {
                    name: "Rose"
                },
                stub = sinon.stub(RPILogModel.prototype, 'create', function(data, callback) {
                    callback(true);
                });

            rpiLogServices.create(data, function(err, result) {
                stub.restore();

                try {
                    should.exist(err);
                    (err.status).should.equal(500);
                    (err.message).should.equal("Error creating log");
                    done();
                } catch (e) {
                    done(e);
                }

            });
        });
        it("Should handle error if model fails to retrieve", function(done) {
            var data = {
                    name: "Rose"
                },
                stub;

            stub = sinon.stub(RPILogModel.prototype, 'findById', function(id, callback) {
                callback(true);
            });

            rpiLogServices.create(data, function(err, result) {
                stub.restore();

                try {
                    should.exist(err);
                    (err.status).should.equal(500);
                    (err.message).should.equal("Error creating log");
                    done();
                } catch (e) {
                    done(e);
                }
            });
        });
    });

    describe("Finding Logs by id", function() {

        beforeEach(function(done) {

            common.resetDatabase(function() {
                done();
            });
        });

        it("Should find a log by id", function(done) {
            var logModel = new RPILogModel(),
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
                    rpiLogServices.findById(logId, function(err, result) {
                        callback(err, result);
                    });
                }
            }, function(err, result) {
                try {
                    should.equal(err, null);
                    should.exist(result);
                    result.find.should.have.property("id");
                    should.equal(result.find.id, logId);
                    done();
                } catch (e) {
                    done(e);
                }
            });
        });

        it("Should not find a log by id", function(done) {

            rpiLogServices.findById('c85e6a70-8a38-11e4-8561-773af88e4896', function(err, result) {
                try {
                    (err.status).should.equal(404);
                    (err.message).should.equal("Log not found");
                    done();
                } catch (e) {
                    done(e);
                }
            });
        });

        it("Should handle error for an invalid id", function(done) {

            rpiLogServices.findById('abc123', function(err, result) {
                try {
                    (err.status).should.equal(404);
                    (err.message).should.equal("Log not found");
                    should.equal(result, null);
                    done();
                } catch (e) {
                    done(e);
                }
            });
        });

        it("Should handle error from the database", function(done) {
            var stub = sinon.stub(RPILogModel.prototype, 'findById', function(id, callback) {
                callback(true);
            });

            rpiLogServices.findById('abc123', function(err, result) {
                stub.restore();

                try {
                    (err.status).should.equal(500);
                    (err.message).should.equal("Error retrieving log");
                    should.equal(result, null);
                    done();
                } catch (e) {
                    done(e);
                }
            });
        });
    });

    describe("Finding All Logs", function() {

        beforeEach(function(done) {

            common.resetDatabase(function() {
                done();
            });
        });

        it("Should find all logs", function(done) {
            var logModel = new RPILogModel(),
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
                    rpiLogServices.findAll(function(err, result) {
                        try {
                            should.equal(err, null);
                            should.exist(result);
                            should.equal(result.logs.length, total);
                            done();
                        } catch (e) {
                            done(e);
                        }
                    });
                }
            );
        });

        it("Should handle error from the database", function(done) {
            var stub = sinon.stub(RPILogModel.prototype, 'findAll', function(callback) {
                callback(true);
            });

            rpiLogServices.findAll(function(err, result) {
                stub.restore();

                try {
                    (err.status).should.equal(500);
                    (err.message).should.equal("Error retrieving logs");
                    should.equal(result, null);
                    done();
                } catch (e) {
                    done(e);
                }
            });
        });
    });

    describe("Updating a Log", function() {

        beforeEach(function(done) {

            common.resetDatabase(function() {
                done();
            });
        });

        it("Should update a log", function(done) {
            var logModel = new RPILogModel(),
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
                update: function(callback) {
                    rpiLogServices.update({
                        id: logId,
                        name: "Orchid"
                    }, function(err, result) {
                        callback(err, result);
                    });
                },
                find: function(callback) {
                    rpiLogServices.findById(logId, function(err, result) {
                        callback(err, result);
                    });
                }
            }, function(err, result) {
                try {
                    should.equal(err, null);
                    should.exist(result);
                    result.find.should.have.property("id");
                    should.equal(result.find.id, logId);
                    should.equal(result.find.name, "Orchid");
                    done();
                } catch (e) {
                    done(e);
                }
            });
        });

        it("Should not be able to update a log with an unknown id (WHY DOES THIS SUCCEED CASSANDRA?)", function(done) {

            rpiLogServices.update({
                id: 'c85e6a70-8a38-11e4-8561-773af88e4896',
                name: 'Thorn'
            }, function(err, result) {
                try {
                    (err.status).should.equal(404);
                    (err.message).should.equal("Log not found");
                    should.equal(result, null);
                    done();
                } catch (e) {
                    done(e);
                }
            });
        });

        it("Should handle error when updating a log with an invalid id", function(done) {

            rpiLogServices.update({
                id: 'abc',
                name: 'Thorn'
            }, function(err, result) {
                try {
                    (err.status).should.equal(404);
                    (err.message).should.equal("Log not found");
                    should.equal(result, null);
                    done();
                } catch (e) {
                    done(e);
                }
            });
        });

        it("Should handle error from the database", function(done) {
            var logModel = new RPILogModel(),
                data = {
                    name: "Rose"
                },
                logId,
                stub = sinon.stub(RPILogModel.prototype, 'update', function(id, callback) {
                    callback(true);
                });

            async.series({
                create: function(callback) {
                    logModel.create(data, function(err, result) {
                        logId = result.id;
                        callback(err, result);
                    });
                },
                update: function(callback) {
                    rpiLogServices.update({
                        id: logId,
                        name: "Orchid"
                    }, function(err, result) {
                        callback(err, result);
                    });
                }
            }, function(err, result) {
                stub.restore();

                try {
                    (err.status).should.equal(500);
                    (err.message).should.equal("Error updating log");
                    should.equal(result.update, null);
                    done();
                } catch (e) {
                    done(e);
                }
            });
        });
    });

    describe("Deleting a Log", function() {

        beforeEach(function(done) {

            common.resetDatabase(function() {
                done();
            });
        });

        it("Should delete a log", function(done) {
            var logModel = new RPILogModel(),
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
                delete: function(callback) {
                    rpiLogServices.delete(logId, function(err, result) {
                        callback(err, result);
                    });
                },
                find: function(callback) {
                    rpiLogServices.findById(logId, function(err, result) {
                        callback(err, result);
                    });
                }
            }, function(err, result) {
                try {
                    (err.status).should.equal(404);
                    (err.message).should.equal("Log not found");
                    done();
                } catch (e) {
                    done(e);
                }
            });
        });

        it("Should not be able to deelte a log with an unknown id (WHY DOES THIS SUCCEED CASSANDRA?)", function(done) {

            rpiLogServices.delete('c85e6a70-8a38-11e4-8561-773af88e4896', function(err, result) {
                try {
                    (err.status).should.equal(404);
                    (err.message).should.equal("Log not found");
                    done();
                } catch (e) {
                    done(e);
                }
            });
        });

        it("Should handle error when updating a log with an invalid id", function(done) {

            rpiLogServices.delete('abc', function(err, result) {
                try {
                    (err.status).should.equal(404);
                    (err.message).should.equal("Log not found");
                    should.equal(result, null);
                    done();
                } catch (e) {
                    done(e);
                }
            });
        });

        it("Should handle error from the database", function(done) {
            var logModel = new RPILogModel(),
                data = {
                    name: "Rose"
                },
                logId,
                stub = sinon.stub(RPILogModel.prototype, 'delete', function(id, callback) {
                    callback(true);
                });

            async.series({
                create: function(callback) {
                    logModel.create(data, function(err, result) {
                        logId = result.id;
                        callback(err, result);
                    });
                },
                delete: function(callback) {
                    rpiLogServices.delete(logId, function(err, result) {
                        callback(err, result);
                    });
                }
            }, function(err, result) {
                stub.restore();

                try {
                    (err.status).should.equal(500);
                    (err.message).should.equal("Error deleting log");
                    done();
                } catch (e) {
                    done(e);
                }
            });
        });
    });
});