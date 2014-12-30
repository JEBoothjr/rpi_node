/*jslint node: true */
'use strict';

var logger = require('../lib/Logger');

module.exports.httpError = function(err, req, res, next) {
    res.status(err.status).send(err.message);

    if (err.status === 500) {
        logger.error(JSON.stringify(err, null, 2));
    }

    next();
};