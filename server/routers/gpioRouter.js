/*jslint node: true */
'use strict';

var express = require('express'),
    router = express.Router(),
    gpioService = require('../services/GPIO').GPIOService;

/**
 * @api {get} /api/gpio/:channel_id Get a Channel value
 * @apiName GetChannelValue
 * @apiGroup GPIO
 *
 * @apiParam {String} channel_id GPIO Channel number.
 *
 * @apiSuccess {string} channel Channel number.
 * @apiSuccess {string} value The value of the Channel (true or false).
 *
 * @apiError (404) message Invalid Channel
 *
 * @apiError (500) message Error reading channel
 */
router.get('/api/gpio/:channel_id', function(req, res) {
    var channel_id = parseInt(req.params.channel_id);

    gpioService.read(channel_id, function(err, result) {
        if (err) {
            return res.status(err.status).json(err.message);
        }

        res.status(200).json(result);
    });
});

/**
 * @api {put} /api/gpio/:channel_id/:channel_value Updates a Channel value
 * @apiName UpdateChannelValue
 * @apiGroup GPIO
 *
 * @apiParam {String} channel_id GPIO Channel number.
 * @apiParam {String} channel_value GPIO Channel value (0 or 1 or true or false).
 *
 * @apiError (404) message Invalid Channel
 *
 * @apiError (500) message Error updating channel
 */
router.put('/api/gpio/:channel_id/:channel_value', function(req, res) {
    var channel_id = parseInt(req.params.channel_id),
        channel_value = req.params.channel_value.toLowerCase();

    channel_value = (channel_value === 'true' || channel_value === '1') ? true : false; //We want it to be a boolean

    gpioService.update(channel_id, channel_value, function(err, result) {
        if (err) {
            return res.status(err.status).json(err.message);
        }

        res.status(200).json(result);
    });
});

exports.router = router;