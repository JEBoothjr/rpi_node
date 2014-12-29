/*jslint node: true */
'use strict';

var http = require('http'),
    util = require('util'),
    logger = require('./Logger');

function ServerError(status, message, data, systemMessage) {
    Error.apply(this, arguments);
    Error.captureStackTrace(this, ServerError);

    this.status = status;
    this.message = message || http.STATUS_CODES[status] || 'Error';

    this.data = data;
    this.systemMessage = systemMessage;

    if (this.status === 500) {
        logger.error(JSON.stringify(arguments, null, 2));
    }
}

util.inherits(ServerError, Error);
ServerError.prototype.name = 'ServerError';
exports.ServerError = ServerError;
