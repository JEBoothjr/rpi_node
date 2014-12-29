/*jslint node: true */
'use strict';

var request,
    app,
    async = require('async'),
    sinon = require('sinon'),
    should = require('should'),
    common = require('./lib/common'),
    RPILogModel = require('../models/RPILog'),
    mock = require('./lib/mock');

before(function(done) {

    common.before(function(params) {
        app = params.app;
        request = params.request;
        done();
    });
});

describe("Log Router", function() {
    describe("Creating Logs", function() {
        beforeEach(function(done) {

            common.resetDatabase(function() {
                done();
            });
        });

        it("Should create a log with minimum requirements", function(done) {
            var body = {
                name: "Rose"
            };

            request(app).post('/logs')
                .send(body)
                .end(function(err, res) {
                    try {
                        should.equal(err, null);
                        res.status.should.equal(200);
                        res.body.should.have.property("id");
                        res.body.should.have.property("name", "Rose");
                        done();
                    } catch (e) {
                        done(e);
                    }
                });
        });
        it("Should create a log with maximum requirements", function(done) {
            var body = {
                name: "Rose",
                description: "The rose is a flower."
            };
            request(app).post('/logs')
                .send(body)
                .end(function(err, res) {
                    try {
                        should.equal(err, null);
                        res.status.should.equal(200);
                        res.body.should.have.property("id");
                        res.body.should.have.property("name", "Rose");
                        res.body.should.have.property("description", "The rose is a flower.");
                        done();
                    } catch (e) {
                        done(e);
                    }
                });
        });
        it("Should fail to create a log due to missing required data", function(done) {
            var body = {};

            request(app).post('/logs')
                .send(body)
                .end(function(err, res) {
                    try {
                        should.equal(err, null);
                        res.status.should.equal(400);
                        res.body.should.equal("The log is missing a name.");
                        done();
                    } catch (e) {
                        done(e);
                    }
                });
        });
        it("Should fail to create a log due to invalid data sent", function(done) {
            var body = {
                name: "Rose",
                id: "asdf1234"
            };

            request(app).post('/logs')
                .send(body)
                .end(function(err, res) {
                    try {
                        should.equal(err, null);
                        res.status.should.equal(400);
                        res.body.should.equal("The log data contains invalid keys: id");
                        done();
                    } catch (e) {
                        done(e);
                    }
                });
        });
        it("Should handle failure from service", function(done) {
            var body = {
                    name: "Rose"
                },
                stub = sinon.stub(RPILogModel.prototype, 'create', function(data, callback) {
                    callback(true);
                });

            request(app).post('/logs')
                .send(body)
                .end(function(err, res) {
                    try {
                        stub.restore();
                        should.equal(err, null);
                        res.status.should.equal(500);
                        res.body.should.equal("Error creating log");
                        done();
                    } catch (e) {
                        done(e);
                    }
                });
        });
    });
    describe("Finding Log By Id", function() {
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
                    request(app).get('/logs/' + logId)
                        .end(function(err, res) {
                            callback(err, res);
                        });
                }
            }, function(err, result) {
                try {
                    should.equal(err, null);
                    result.find.status.should.equal(200);
                    result.find.body.should.have.property("id");
                    result.find.body.should.have.property("name", "Rose");
                    done();
                } catch (e) {
                    done(e);
                }
            });
        });
        it("Should not find a log by id using an unknown id", function(done) {
            request(app).get('/logs/' + 'c85e6a70-8a38-11e4-8561-773af88e4896')
                .end(function(err, res) {
                    try {
                        should.equal(err, null);
                        res.status.should.equal(404);
                        res.body.should.equal("Log not found");
                        done();
                    } catch (e) {
                        done(e);
                    }
                });
        });
        it("Should send error when using an invalid id", function(done) {
            request(app).get('/logs/' + 'abc123')
                .end(function(err, res) {
                    try {
                        should.equal(err, null);
                        res.status.should.equal(404);
                        res.body.should.equal("Log not found");
                        done();
                    } catch (e) {
                        done(e);
                    }
                });
        });
        it("Should handle failure from service", function(done) {
            var stub = sinon.stub(RPILogModel.prototype, 'findById', function(data, callback) {
                callback(true);
            });

            request(app).get('/logs/' + 'abc123')
                .end(function(err, res) {
                    try {
                        stub.restore();
                        should.equal(err, null);
                        res.status.should.equal(500);
                        res.body.should.equal("Error retrieving log");
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
                    request(app).get('/logs')
                        .end(function(err, res) {
                            try {
                                should.equal(err, null);
                                res.status.should.equal(200);
                                res.body.logs.length.should.equal(25);
                                done();
                            } catch (e) {
                                done(e);
                            }
                        });
                }
            );
        });

        it("Should find no logs", function(done) {
            request(app).get('/logs')
                .end(function(err, res) {
                    try {
                        should.equal(err, null);
                        res.status.should.equal(404);
                        res.body.should.equal("Logs not found");
                        done();
                    } catch (e) {
                        done(e);
                    }
                });
        });

        it("Should handle failure from service", function(done) {
            var stub = sinon.stub(RPILogModel.prototype, 'findAll', function(callback) {
                callback(true);
            });

            request(app).get('/logs')
                .end(function(err, res) {
                    try {
                        stub.restore();
                        should.equal(err, null);
                        res.status.should.equal(500);
                        res.body.should.equal("Error retrieving logs");
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
                    request(app).put('/logs/' + logId)
                        .send({
                            name: "Orchid"
                        })
                        .end(function(err, res) {
                            callback(err, res);
                        });
                }
            }, function(err, result) {
                try {
                    should.equal(err, null);
                    result.update.status.should.equal(200);
                    result.update.body.should.have.property("id");
                    result.update.body.should.have.property("name", "Orchid");
                    done();
                } catch (e) {
                    done(e);
                }
            });
        });

        it("Should send error for updating a name", function(done) {
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
                    request(app).put('/logs/' + logId)
                        .send({
                            name: ""
                        })
                        .end(function(err, res) {
                            callback(err, res);
                        });
                }
            }, function(err, result) {
                try {
                    result.update.status.should.equal(400);
                    result.update.body.should.equal("The log is missing a name.");
                    done();
                } catch (e) {
                    done(e);
                }
            });
        });

        it("Should send error for updating an invalid key", function(done) {
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
                    request(app).put('/logs/' + logId)
                        .send({
                            name: "Orchid",
                            badKey: "stuff"
                        })
                        .end(function(err, res) {
                            callback(err, res);
                        });
                }
            }, function(err, result) {
                try {
                    result.update.status.should.equal(400);
                    result.update.body.should.equal("The log data contains invalid keys: badKey");
                    done();
                } catch (e) {
                    done(e);
                }
            });
        });

        it("Should fail to update an unknown log id", function(done) {
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
                    request(app).put('/logs/' + 'c85e6a70-8a38-11e4-8561-773af88e4896')
                        .send({
                            name: "Orchid"
                        })
                        .end(function(err, res) {
                            callback(err, res);
                        });
                }
            }, function(err, result) {
                try {
                    result.update.status.should.equal(404);
                    result.update.body.should.equal("Log not found");
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
                del: function(callback) {
                    request(app).delete('/logs/' + logId)
                        .end(function(err, res) {
                            callback(err, res);
                        });
                }
            }, function(err, result) {
                try {
                    should.equal(err, null);
                    result.del.status.should.equal(200);
                    done();
                } catch (e) {
                    done(e);
                }
            });
        });

        it("Should not delete a log with an unknown id", function(done) {
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
                del: function(callback) {
                    request(app).delete('/logs/' + 'c85e6a70-8a38-11e4-8561-773af88e4896')
                        .end(function(err, res) {
                            callback(err, res);
                        });
                }
            }, function(err, result) {
                try {
                    should.equal(err, null);
                    result.del.status.should.equal(404);
                    result.del.body.should.equal("Log not found");
                    done();
                } catch (e) {
                    done(e);
                }
            });
        });

        it("Should not delete a log with an invalid id", function(done) {
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
                del: function(callback) {
                    request(app).delete('/logs/' + 'badId')
                        .end(function(err, res) {
                            callback(err, res);
                        });
                }
            }, function(err, result) {
                try {
                    should.equal(err, null);
                    result.del.status.should.equal(404);
                    result.del.body.should.equal("Log not found");
                    done();
                } catch (e) {
                    done(e);
                }
            });
        });
    });
});