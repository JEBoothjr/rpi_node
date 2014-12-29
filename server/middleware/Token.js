/*jslint node: true */
'use strict';

var logger = require('../lib/Logger');

module.exports.token = function(req, res, next) {
    var token = req.headers.Authorization;

    res.locals.user_ip = req.headers['x-forwarded-for'] ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        req.connection.socket.remoteAddress;

    if (token) {
        //Validate the token and respond accordingly.
        next();
    } else {
        logger.debug("No Token");
        //No token, so let other middleware handle it accordingly
        next();
    }
};
