/*jslint node: true */
'use strict';

var should = require('should'),
    ServerError = require('../lib/Error').ServerError;

describe("Error Tests", function() {

    describe("ServerError", function() {
        it("Should properly format server errors", function(done) {
            var err = new ServerError(500, "Something went terrible wrong.");

            (err.status).should.equal(500);
            (err.message).should.equal("Something went terrible wrong.");
            done();
        });
        it("Should use the appropriate http message when a custom message isn't supplied.", function(done) {
            var err = new ServerError(400),
                err2 = new ServerError(401),
                err3 = new ServerError(404),
                err4 = new ServerError(500),
                customErr = new ServerError(1000);

            try {
                (err.status).should.equal(400);
                (err.message).should.equal("Bad Request");
                (err2.status).should.equal(401);
                (err2.message).should.equal("Unauthorized");
                (err3.status).should.equal(404);
                (err3.message).should.equal("Not Found");
                (err4.status).should.equal(500);
                (err4.message).should.equal("Internal Server Error");
                (customErr.status).should.equal(1000);
                (customErr.message).should.equal("Error");
                done();
            } catch (e) {
                done(e);
            }

        });
    });
});
