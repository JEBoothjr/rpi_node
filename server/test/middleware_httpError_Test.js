/*jslint node: true */
/* global it, before, after, describe, xit, xdescribe */
'use strict';

var logger = require('../lib/Logger'),
    http = require('http'),
    config = require('config'),
    sinon = require('sinon'),
    should = require('should'),
    httpMocks = require('node-mocks-http'),
    ServerError = require('../lib/Error').ServerError,
    errorMiddleware = require('../middleware/HttpError.js').httpError;

if (!logger.configured) {
    logger.configure(config.logging.winston);
}

describe("HttpError Middleware Tests", function() {
    it("Should create an valid 404 http error", function(done) {
        var next = sinon.spy();

        errorMiddleware(new ServerError(404, "Log not found"), httpMocks.createRequest(), httpMocks.createResponse(), next);

        should.equal(next.called, true)

        done();
    });

    it("Should create an valid 500 http error", function(done) {
        var next = sinon.spy();

        errorMiddleware(new ServerError(500, "Internal Server Error"), httpMocks.createRequest(), httpMocks.createResponse(), next);

        should.equal(next.called, true)

        done();
    });
});