/*jslint node: true */
'use strict';

var request,
    app,
    async = require('async'),
    sinon = require('sinon'),
    should = require('should'),
    common = require('./lib/common');

before(function(done) {

    common.before(function(params) {
        app = params.app;
        request = params.request;
        done();
    });
});

describe("API Docs Router", function() {
    describe("Getting API Docs (placeholder route)", function() {

        it("Should get API docs", function(done) {
            request(app).get('/api')
                .end(function(err, res) {
                    try {
                        should.equal(err, null);
                        res.status.should.equal(200);
                        done();
                    } catch (e) {
                        done(e);
                    }
                });
        });
    });
});