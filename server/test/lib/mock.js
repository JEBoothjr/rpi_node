var _ = require('lodash'),
    words = require('./mocks/words.json'),
    async = require('async'),
    RPILogModel = require('../../models/RPILog');

exports.generateEntityName = function() {
    var result,
        doConcat = Math.floor(Math.random() * 2),
        word1 = words[Math.floor(Math.random() * words.length)],
        word2 = words[Math.floor(Math.random() * words.length)];

    word1 = word1.charAt(0).toUpperCase() + word1.slice(1);
    word2 = word2.charAt(0).toUpperCase() + word2.slice(1);

    if (doConcat) {
        result = word1 + " and " + word2;
    } else {
        result = word1;
    }

    return result;
};


exports.createLog = function(options, callback) {
    var rpiLogModel = new RPILogModel();

    if (arguments.length < 2) {
        callback = _.isFunction(options) ? options : null;
        options = null;
    }
    options = (!_.isObject(options)) ? {} : options;

    options.name = options.name || this.generateEntityName();

    rpiLogModel.create(options, function(err, result) {
        callback(err, result);
    });
};