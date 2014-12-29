/*jslint node: true */
/* global it, before, after, describe, xit, xdescribe */
'use strict';

var logger = require('../lib/Logger'),
    http = require('http'),
    config = require('config'),
    sinon = require('sinon'),
    should = require('should'),
    httpMocks = require('node-mocks-http'),
    tokenMiddleware = require('../middleware/Token.js').token;

if (!logger.configured) {
    logger.configure(config.logging.winston);
}

describe("Token Middleware Tests", function() {
    it("Should handle a token", function(done) {
        var next = sinon.spy(),
            req = httpMocks.createRequest(),
            res = httpMocks.createResponse();

        req.headers['x-forwarded-for'] = '127.0.0.1';
        req.headers.Authorization = 'Bearer abc123';
        res.locals = {};

        tokenMiddleware(req, res, next);

        should.equal(res.locals.user_ip, '127.0.0.1');
        should.equal(next.called, true);

        done();
    });

    it("Should handle x-forwarded-for header to get user ipaddress", function(done) {
        var next = sinon.spy(),
            req = httpMocks.createRequest(),
            res = httpMocks.createResponse();

        req.headers['x-forwarded-for'] = '127.0.0.1';
        res.locals = {};

        tokenMiddleware(req, res, next);

        should.equal(res.locals.user_ip, '127.0.0.1');
        should.equal(next.called, true);

        done();
    });

    it("Should handle connection.remoteAddress header to get user ipaddress", function(done) {
        var next = sinon.spy(),
            req = httpMocks.createRequest(),
            res = httpMocks.createResponse();

        req.connection = {
            remoteAddress: '127.0.0.1'
        };
        req.socket = {};

        res.locals = {};

        tokenMiddleware(req, res, next);

        should.equal(res.locals.user_ip, '127.0.0.1');
        should.equal(next.called, true);

        done();
    });

    it("Should handle socket.remoteAddress header to get user ipaddress", function(done) {
        var next = sinon.spy(),
            req = httpMocks.createRequest(),
            res = httpMocks.createResponse();

        req.connection = {};
        req.socket = {
            remoteAddress: '127.0.0.1'
        };

        res.locals = {};

        tokenMiddleware(req, res, next);

        should.equal(res.locals.user_ip, '127.0.0.1');
        should.equal(next.called, true);

        done();
    });

    it("Should handle connection.socket.remoteAddress header to get user ipaddress", function(done) {
        var next = sinon.spy(),
            req = httpMocks.createRequest(),
            res = httpMocks.createResponse();

        req.connection = {
            socket: {
                remoteAddress: '127.0.0.1'
            }
        };
        req.socket = {};

        res.locals = {};

        tokenMiddleware(req, res, next);

        should.equal(res.locals.user_ip, '127.0.0.1');
        should.equal(next.called, true);

        done();
    });
});
