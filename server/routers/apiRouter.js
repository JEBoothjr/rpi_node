/*jslint node: true */
'use strict';

var express = require('express'),
    router = express.Router();

/**
 * @api {get} / Displays the API documentation
 * @apiName GetAPIDocumentation
 * @apiGroup API
 *
 * @apiSuccess (200) html Displays the API documentation.
 */
router.get('/api', function(req, res) {
    res.send('API Docs!!');
});

exports.router = router;