/*jslint node: true */
'use strict';

var request,
    fs = require('fs'),
    async = require('async'),
    del = require('del'),
    sinon = require('sinon'),
    should = require('should'),
    SIM_PATH = './server/test/simulation/sys';

describe("RasPi_GPIO", function() {
    describe("Initializing a GPIO", function() {

        beforeEach(function(done) {
            if (fs.existsSync()) {
                del.sync(SIM_PATH);
            }
            fs.mkdirSync(SIM_PATH);

            done();
        });

        it("Should create a log", function(done) {
            done();
        });
    });
});