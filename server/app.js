/*jslint node: true */
'use strict';

var config = require('config'),
    async = require('async'),
    express = require('express'),
    app = express(),
    cookieParser = require('cookie-parser'),
    bodyParser = require('body-parser'),
    domain = require('domain'),
    topDomain = domain.create(),
    Cassandra = require('cassandra-driver'),
    errorMiddleware = require('./middleware/HttpError.js').httpError,
    tokenMiddleware = require('./middleware/Token.js').token,
    siteRouter = require('./routers/siteRouter').router,
    authRouter = require('./routers/apiRouter').router,
    logRouter = require('./routers/logRouter').router,
    gpioRouter = require('./routers/gpioRouter').router,
    logger = require('./lib/Logger'),
    BaseModel = require('./models/Base'),
    cassandraClient;

/* istanbul ignore next */
if (!logger.configured) {
    logger.configure(config.logging.winston);
}

/* istanbul ignore next */
topDomain.on('error', function(error) {
    var message = (error.message || error) + ((error && error.stack) ? "\n" + error.stack : '');

    logger.error(message);
});

var initApp = function(callback) {

    logger.info("Initializing Application");

    callback(null, true);
};

var initRoutingAndMiddleware = function(callback) {
    logger.info("Initializing Routing and Middleware");

    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({
        extended: true
    }));
    app.use(cookieParser());

    app.use(tokenMiddleware); //Must be first for token middleware to be handled first
    app.use(siteRouter);
    app.use(authRouter);
    app.use(logRouter);
    app.use(gpioRouter);

    app.use(errorMiddleware); //Must be last

    callback(null, true);
};

var startCassandra = function(callback) {
    var dbConfig = config.util.cloneDeep(config.db);

    logger.info("Starting Cassandra Client");

    //config module v1.0.0 no longer supports mutable config values, so we need to clone it and set it.
    dbConfig.username = process.env.CASS_USER || dbConfig.username;
    dbConfig.password = process.env.CASS_PASS || dbConfig.password;

    cassandraClient = new Cassandra.Client(dbConfig);
    cassandraClient.connect(function(err) {
        /* istanbul ignore if */
        if (err) {
            logger.error("Database Error :\r\n" + JSON.stringify(err, null, 2));
            return callback(new Error("The database failed to connect!"), false);
        }

        cassandraClient.on('log', function(level, className, message, furtherInfo) {
            logger.info('log event: %s \n %s \n %s', level, message, furtherInfo);
        });

        callback(false, true);
    });
};

var setupModels = function(callback) {
    logger.info("Initializing Models");

    BaseModel.prototype.client = cassandraClient;
    BaseModel.prototype.driver = Cassandra;

    callback(false, true);
};

var startServer = function(callback) {
    logger.info("Starting Server...");

    /* istanbul ignore next */
    var port = config.server.port || process.env.PORT;
    app.set('port', port);

    var server = app.listen(app.get('port'), function() {
        logger.info('Server listening on port ' + server.address().port);
        return callback(null, true);
    });
};

topDomain.run(function() {

    async.series([
            function(callback) {
                initApp(callback);
            },
            function(callback) {
                initRoutingAndMiddleware(callback);
            },
            function(callback) {
                startCassandra(callback);
            },
            function(callback) {
                setupModels(callback);
            },
            function(callback) {
                startServer(callback);
            }
        ],
        function(err) {
            /* istanbul ignore next */
            if (err) {
                logger.error("Server startup sequence failed :\r\n" + err.message + "\r\n" + err.stack);
            } else {
                console.log('Server Started : ' + new Date());
            }
        });
});

// For supertest
module.exports = app;