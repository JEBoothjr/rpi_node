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

describe("Site Router", function() {
    describe("Getting site root (placeholder route)", function() {

        it("Should get site root", function(done) {
            request(app).get('/')
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