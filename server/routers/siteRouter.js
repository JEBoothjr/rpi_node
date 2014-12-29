/*jslint node: true */
'use strict';

var express = require('express'),
    router = express.Router();

router.get('/', function(req, res) {
    res.send('Welcome to Raspberry Pi');
});

exports.router = router;