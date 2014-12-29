/*jslint node: true */
"use strict";

var _ = require('lodash'),
    logger = require('../lib/Logger'),
    resultProcessor = require('../utils/ResultProcessor');

var Model = function() {
    //this.initialize.apply(this, arguments);
};

var wrapQuotes = function(value) {
    /* istanbul ignore else */
    if (_.isString(value)) {
        value = "'" + value + "'";
    }

    return value;
};

Model.prototype.execute = function(query, params, options, callback) {
    this.client.execute(query, params, options, function(err, result) {
        if (err) {
            logger.error(query, params, JSON.stringify(options, null, 2), JSON.stringify(err, null, 2));
        }
        callback(err, result);
    });
};

Model.prototype.buildSetQuery = function(query, data) {
    var segments = [],
        key,
        result;

    for (key in data) {
        segments.push(key + "=" + wrapQuotes(data[key]));
    }

    result = segments.join(', ');
    result = query.replace('<%>', result);

    return result;
};

Model.prototype.processResults = function(result) {
    return resultProcessor(result);
};

module.exports = exports = Model;
