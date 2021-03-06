/*jslint node: true */
'use strict';

var express = require('express'),
    router = express.Router(),
    logService = require('../services/Log').LogService;

function validateLogData(data) {
    var keys = ["name", "description"],
        prop,
        result = [];

    for (prop in data) {
        if (keys.indexOf(prop) === -1) {
            result.push(prop);
        }
    }
    return result;
}

/**
 * @api {post} /api/logs Create a Log
 * @apiName CreateLogs
 * @apiGroup Log
 *
 * @apiParam {String} name The name of the Log.
 * @apiParam {string} [description] The description of the Log.
 *
 * @apiSuccess {string} id The unique ID of the Log.
 *
 * @apiError (400) message The log is missing a name.
 * @apiError (400) message The log data contains invalid keys: ?
 *
 * @apiError (500) message Error creating log
 */
router.post('/api/logs', function(req, res) {
    var logData = req.body,
        invalidKeys;

    if (!logData || !logData.hasOwnProperty('name') || (logData.name.length === 0)) {
        return res.status(400).json("The log is missing a name.");
    }

    invalidKeys = validateLogData(logData);

    if (invalidKeys.length > 0) {
        return res.status(400).json("The log data contains invalid keys: " + invalidKeys.join(', '));
    }

    logService.create(logData, function(err, result) {
        if (err) {
            return res.status(err.status).json(err.message);
        }

        res.status(200).json(result);
    });
});

/**
 * @api {get} /api/logs/:log_id Get a Log
 * @apiName GetLog
 * @apiGroup Log
 *
 * @apiParam {String} log_id Log unique ID.
 *
 * @apiSuccess {string} id The unique ID of the Log.
 * @apiSuccess {string} name The name of the Log.
 * @apiSuccess {string} description The description of the Log.
 *
 * @apiError (404) message Log not found
 *
 * @apiError (500) message Error retrieving log
 */
router.get('/api/logs/:log_id', function(req, res) {
    logService.findById(req.params.log_id, function(err, result) {
        if (err) {
            return res.status(err.status).json(err.message);
        }

        res.status(200).json(result);
    });
});

/**
 * @api {get} /api/logs Get all Logs
 * @apiName GetLogs
 * @apiGroup Log
 *
 * @apiSuccess {Object[]} logs       List of Logs.
 * @apiSuccess {string} logs.id The unique ID of the Log.
 * @apiSuccess {string} logs.name The name of the Log.
 * @apiSuccess {string} logs.description The description of the Log.
 *
 * @apiError (404) message Logs not found
 *
 * @apiError (500) message Error retrieving logs
 */
router.get('/api/logs', function(req, res) {
    logService.findAll(function(err, result) {
        if (err) {
            return res.status(err.status).json(err.message);
        }

        res.status(200).json(result);
    });
});

/**
 * @api {put} /api/logs/:log_id Update a Log
 * @apiName UpdateLog
 * @apiGroup Log
 *
 * @apiParam {String} [name] The name of the Log.
 * @apiParam {string} [description] The description of the Log.
 *
 * @apiError (404) message Log not found
 * @apiError (400) message The log is missing a name.
 * @apiError (400) message The log data contains invalid keys: ?
 * @apiError (400) message Cannot update a published log
 *
 * @apiError (500) message Error updating log
 */
router.put('/api/logs/:log_id', function(req, res) {
    var logData = req.body,
        invalidKeys;

    if (typeof logData.name === 'string' && logData.name.length === 0) {
        return res.status(400).json("The log is missing a name.");
    }

    invalidKeys = validateLogData(logData);

    if (invalidKeys.length > 0) {
        return res.status(400).json("The log data contains invalid keys: " + invalidKeys.join(', '));
    }

    logData.id = req.params.log_id;

    logService.update(logData, function(err, result) {
        if (err) {
            return res.status(err.status).json(err.message);
        }

        res.status(200).json(result);
    });
});

/**
 * @api {delete} /api/logs/:log_id Delete a Log
 * @apiName DeleteLog
 * @apiGroup Log
 *
 * @apiParam {String} log_id Log unique ID.
 *
 * @apiError (404) message Log not found
 * @apiError (400) message Cannot delete a published log
 *
 * @apiError (500) message Error deleting log
 */
router.delete('/api/logs/:log_id', function(req, res) {
    logService.delete(req.params.log_id, function(err, result) {
        if (err) {
            return res.status(err.status).json(err.message);
        }

        res.status(200).json(result);
    });
});

exports.router = router;