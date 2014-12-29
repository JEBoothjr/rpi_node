var execute = require('child_process').exec,
    async = require('async'),
    app,
    request,
    beforeHasRan = false,
    afterHasRan = false;

exports.before = function(callback) {
    if (beforeHasRan) {
        return callback({
            app: app,
            request: request
        });
    }

    request = require('supertest');
    app = require('../../app.js');

    beforeHasRan = true;

    this.resetDatabase(function() {
        //This timeout gives the app enough time to start up and connect to the database and initialize the models.
        setTimeout(function() {
            callback({
                app: app,
                request: request
            });
        }, 3000);
    });
};

exports.resetDatabase = function(callback) {
    async.series([
        function(callback) {
            execute("node ./server/tools/CQL -s -f ../test/cql/resetTestKeyspace.cql", function(error, stdout, stderr) {
                if (error) throw error;

                callback(error, stdout);
            });
        },
        function(callback) {
            execute("node ./server/tools/CQL -s -f ../cql/setupDB.cql -k rpi_test", function(error, stdout, stderr) {
                if (error) throw error;

                callback(error, stdout);
            });
        }
    ], function(err, result) {
        if (err) {
            throw err;
        }

        callback();
    });
};