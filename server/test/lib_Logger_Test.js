/*jslint node: true */
/* global it, before, after, describe, xit, xdescribe */
'use strict';

var fs = require('fs'),
    config = require('config'),
    should = require('should'),
    _ = require('lodash'),
    winston = require('winston'),
    logger = require('../lib/Logger'),
    conf_log = JSON.parse(JSON.stringify(config.logging.winston));

describe("Logger Tests", function() {
    before(function(done) {
        if (fs.existsSync('./testlogs')) {
            fs.rmdirSync('./testlogs');
        }
        done();
    });
    after(function(done) {
        if (fs.existsSync('./testlogs')) {
            fs.rmdirSync('./testlogs');
        }
        done();
    });
    it("Will throw error if no config is passed to configure", function(done) {

        logger.config = null;
        (function() {
            logger.configure();
        }).should.throw("No configuration has been supplied.");

        done();
    });
    it("Will throw error if no transports are passed in config", function(done) {

        logger.config = null;
        logger.configured = false;
        conf_log.transports = null;

        (function() {
            logger.configure(conf_log);
        }).should.throw("Missing transport definitions for logging.");

        done();
    });
    it("Will not throw error if a config is passed to configure", function(done) {

        (function() {
            logger.configure(config.logging.winston);
        }).should.not.throw("No configuration has been supplied.");

        done();
    });
    it("Will throw error if attempting to configure again", function(done) {

        logger.configured = true;
        (function() {
            logger.configure(config.logging.winston);
        }).should.throw("The logger is already configured.");

        done();
    });
    it("Will not throw error if a transport is added", function(done) {

        (function() {
            logger.addTransport(winston.transports.File, {
                filename: "test.log"
            });
        }).should.not.throw("Error adding transport.");

        done();
    });
    it("Can return an instance of Winston", function(done) {
        var instance = logger.instance();
        instance.should.not.equal(null);
        done();
    });
    it("Can log with all methods without throwing an error", function(done) {
        (function() {
            logger.silly("This is a silly log");
            logger.info("This is a info log");
            logger.error("This is a error log");
            logger.debug("This is a debug log");
            logger.warn("This is a warn log");
            logger.verbose("This is a verbose log");
        }).should.not.throw();
        done();
    });
    it("Can log methods without throwing an error", function(done) {
        (function() {
            logger.log("info", "test");
        }).should.not.throw();
        done();
    });
    it("Can be configured to exitOnError", function(done) {
        (function() {
            logger.configured = false;
            conf_log = JSON.parse(JSON.stringify(config.logging.winston));
            conf_log.exitOnError = true;
            logger.configure(conf_log);
        }).should.not.throw();
        done();
    });
    it("Can be configured to create the logs folder if it doesn't exist", function(done) {
        (function() {
            logger.configured = false;
            conf_log = JSON.parse(JSON.stringify(config.logging.winston));
            delete conf_log.folder;
            if (fs.existsSync('./testlogs')) {
                fs.rmdirSync('./testlogs');
            }
            logger.configure(conf_log);
            fs.existsSync('./logs').should.equal(true);
        }).should.not.throw();
        done();
    });
    it("Will use the default levels with an error", function(done) {
        (function() {
            logger.configured = false;
            conf_log = JSON.parse(JSON.stringify(config.logging.winston));
            delete conf_log.levels;
            logger.configure(conf_log);
        }).should.not.throw();
        done();
    });
});
