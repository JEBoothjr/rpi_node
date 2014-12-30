/*jslint node: true */
'use strict';

var async = require('async'),
    ServerError = require('../lib/Error').ServerError,
    LogModel = require('../models/Log');

function LogService() {
    this.create = function(data, callback) {
        var logModel = new LogModel();

        async.series({
            create: function(callback) {
                logModel.create(data, function(err, result) {
                    callback(err, result);
                });
            },
            find: function(callback) {
                logModel.findById(data.id, function(err, result) {
                    callback(err, result);
                });
            }
        }, function(err, result) {
            if (err) {
                err = new ServerError(500, "Error creating log", data, err);
            }
            callback(err, result.find);
        });
    };

    this.findById = function(id, callback) {
        var logModel = new LogModel();

        logModel.findById(id, function(err, result) {
            //8704 is for an invalid uuid
            if (err && err.code !== 8704) {
                return callback(new ServerError(500, "Error retrieving log", id, err));
            }
            if (!result) {
                return callback(new ServerError(404, "Log not found", id, err));
            }

            callback(null, result);
        });
    };

    this.findAll = function(callback) {
        var logModel = new LogModel();

        logModel.findAll(function(err, result) {
            if (err) {
                return callback(new ServerError(500, "Error retrieving logs", null, err));
            }

            //TODO : Decide whether to use a 404 or an empty array
            if (!result || result.length === 0) {
                return callback(new ServerError(404, "Logs not found", null, err));
            }

            callback(null, {
                logs: result
            });
        });
    };

    this.update = function(data, callback) {
        var logModel = new LogModel(),
            logId = data.id; //This get deleted in the model.update method

        async.series({
            verify: function(callback) {
                logModel.findById(data.id, function(err, result) {
                    if (!result) {
                        return callback(new ServerError(404, "Log not found", null, err));
                    }

                    callback(err, result);
                });
            },
            update: function(callback) {
                logModel.update(data, function(err, result) {
                    callback(err, result);
                });
            },
            retrieve: function(callback) {
                logModel.findById(logId, function(err, result) {
                    callback(err, result);
                });
            }
        }, function(err, result) {
            //We need to return the 'found' log
            if (err) {
                err = new ServerError(err.status || 500, err.message || "Error updating log", data, err);
            }
            callback(err, result.retrieve || null);
        });
    };

    this.delete = function(id, callback) {
        var logModel = new LogModel();

        async.series({
            verify: function(callback) {
                logModel.findById(id, function(err, result) {
                    if (!result) {
                        return callback(new ServerError(404, "Log not found", null, err));
                    }

                    callback(err, result);
                });
            },
            del: function(callback) {
                logModel.delete(id, function(err, result) {
                    if (err) {
                        return callback(new ServerError(500, "Error deleting log", id, err));
                    }
                    callback(err, result);
                });
            }
        }, function(err) {
            callback(err, null);
        });
    };
}

exports.LogService = new LogService();