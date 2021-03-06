var config = require('config'),
    program = require("commander"),
    ProgressBar = require('progress'),
    async = require('async'),
    fs = require('fs'),
    path = require('path'),
    Cassandra = require('cassandra-driver'),
    cassandraClient = null,
    files = [],
    batchQueries = [],
    cqlRegex = /-{0,}\s*<cql[^>]*>([\s\S]*?)-{0,}\s*<\/cql>/gmi,
    productionRunDelay = 10,
    bar = new ProgressBar('Countdown to Production [:bar]', {
        total: productionRunDelay,
        complete: '=',
        incomplete: ' '
    }),
    barTimer = null;

program.on('--help', function() {
    console.log("  Examples:");
    console.log("");
    console.log("    $ node CQL -k rpi_test                                       Sets the keyspace where the scripts will run.");
    console.log("    $ node CQL --keyspace rpi_test                               Sets the keyspace where the scripts will run.");
    console.log("    $ node CQL -c 'DROP KEYSPACE IF EXISTS rpi_test;'            Runs a cql script.");
    console.log("    $ node CQL --cql 'DROP KEYSPACE IF EXISTS rpi_test;'         Runs a cql script.");
    console.log("    $ node CQL -f /start.cql                                         Runs a cql from a single file.");
    console.log("    $ node CQL -files /start.cql                                     Runs a cql from a single file.");
    console.log("    $ node CQL -f /start.cql,/migrations.json                        Runs a cql from multiple files.");
    console.log("    $ node CQL -files /start.cql,/end.cql                            Runs a cql from multiple files.");
    console.log("    $ node CQL -files /start.cql,/end.cql --silent                   Runs the scripts silently.");
    console.log("    $ node CQL -files /start.cql,/end.cql -s                         Runs the scripts silently.");
    console.log("    $ node CQL -files /start.cql,/end.cql --production               Forces running the scripts while in a production environment.");
    console.log("    $ node CQL -files /start.cql,/end.cql -s --production            Forces running the scripts silently while in a production environment.");
    console.log("");
    console.log("Each CQL statement in the files must begin with <cql> and end with </cql>");
    console.log("<cql>");
    console.log("CREATE KEYSPACE IF NOT EXISTS rpi WITH REPLICATION = {'class' : 'SimpleStrategy', 'replication_factor': 1};");
    console.log("</cql>");
    console.log("");
});

program
    .option('-k, --keyspace "<keyspace>"', "The name of the keyspace to use.")
    .option('-c, --cql "<cqlStatement>"', "Run a single cql statement.")
    .option('-f, --files <path,path>', "Execute a .cql file or sequentially execute a group of .cql files, using comma-delimited paths and no spaces. Also a formatted JSON file - [{\"file\":\"a.cql\"},{\"file\":\"b.cql\"}].")
    .option('-s, --silent', "Hide output while executing.", false)
    .option('--production', "Overrides prevention of running against production. Don't do this unless you really, REALLY, mean it.", false)
    .parse(process.argv);

//Force verbosity in production mode.
program.silent = (process.env.NODE_ENV === 'production') ? false : program.silent;

/**
 * Verifies the arguments are valid and ant require arguments are handled.
 * @param  {Function} callback Callback to async with error or success
 */
var processArguments = function(callback) {
    var filePath;

    output("Processing arguments...");

    if (program.cql) {
        batchQueries.push(program.cql.toString().trim());
    }

    if ((!program.keyspace || program.keyspace.length === 0)) {
        output("A keyspace has not been defined. Most CQL will fail.");
    }

    if ((!program.files || program.files.length === 0) && (!program.cql || program.cql.length === 0) && (!program.migration || program.migration.length === 0)) {
        return callback("Need a file to load or cql to run. Use -f=filename or --files=filename,filename or -cql='someCQLStatement;' or --cql='someCQLStatement;'. Run node CQL --help for mode information.", false);
    } else if (process.env.NODE_ENV === 'production' && !program.production) {
        return callback("CQL cannot be run while the NODE_ENV is set to production.", false);
    } else if (program.production && process.env.NODE_ENV === 'production') {
        output("***** Preparing to run scripts in production mode *****");
        output("***** You have " + productionRunDelay + " seconds to think about what your doing before the scripts will execute. *****");
        output("***** CTRL+C to Exit *****");

        barTimer = setInterval(function() {
            bar.tick();
            if (bar.complete) {
                output("***** OK! Here we go... *****");
                output("***** Running scripts in production mode *****");
                clearInterval(barTimer);
                return callback(null, true);
            }
        }, 1000);

        return;

    } else if (program.production && process.env.NODE_ENV !== 'production') {
        return callback("NODE_ENV is set not set to production, but you attempted to run in production mode.", false);
    }

    callback(null, true);
};

var processMigrationFile = function(filePath, callback) {
    var data,
        extension,
        k;

    data = require(filePath);
    for (k = 0; k < data.length; k++) {
        filePath = data[k].file;
        extension = filePath.split(".");
        extension = extension[extension.length - 1].toLowerCase();
        if (fs.existsSync(filePath)) {
            if (extension === "json") {
                processMigrationFile(filePath, callback);
            } else {
                file = fs.readFileSync(filePath);
                files.push(file);
            }
        } else {
            return callback("File does not exist, " + filePath, false);
        }
    }
}

/**
 * Loads a file/s from the argument
 * @param  {String} path The path of the file to load
 * @param  {Function} callback Callback to async with error or success
 */
var loadFiles = function(callback) {
    var argFiles,
        filePath,
        extension,
        file,
        i,
        j;

    if (!program.files || program.files.length === 0) {
        return callback(null, true);
    }

    argFiles = program.files.split(',');

    output("Loading files...");

    for (i = 0; i < argFiles.length; i++) {
        filePath = path.resolve(__dirname, argFiles[i].toString());
        output("Reading file..." + filePath);
        if (fs.existsSync(filePath)) {
            extension = filePath.split(".");
            extension = extension[extension.length - 1].toLowerCase();
            if (extension === "json") {
                processMigrationFile(filePath, callback);
            } else {
                file = fs.readFileSync(filePath);
                files.push(file);
            }
        } else {
            return callback("File does not exist, " + filePath, false);
        }
    }

    callback(null, true);
};

/**
 * Starts Cassandra.
 * @param  {Function} callback Callback to async with error or success
 */
var startCassandra = function(callback) {
    var dbConfig = config.util.cloneDeep(config.db);

    var opts = {};
    output("Connecting to database...");
    //We need to be able to do anything with any keyspace. We just need a db connection. Just send
    //in the hosts, username and password, stripping the keyspace.
    //config module v1.0.0 no longer supports mutable config values, so we need to clone it and set it.
    dbConfig.username = process.env.CASS_USER || dbConfig.username;
    dbConfig.password = process.env.CASS_PASS || dbConfig.password;

    delete dbConfig.keyspace; //We want a vanilla connection

    cassandraClient = new Cassandra.Client(dbConfig);
    cassandraClient.connect(function(err, result) {
        if (err) {
            console.log("Database Error :\r\n" + JSON.stringify(err, null, 2));
            return callback(new Error("The database failed to connect!"), false);
        }

        cassandraClient.on('log', function(level, className, message, furtherInfo) {
            console.log('log event: %s -- %s', level, message);
        });

        callback(false, true);
    });
};

/**
 * Processes the queries from the files loaded and builds the batch of individual statements to run.
 * @param  {Function} callback Callback to async with error or success
 */
var processQueries = function(callback) {
    var result,
        i;

    if (!files || files.length === 0) {
        return callback(null, true);
    }

    output("Processing queries...");

    for (i = 0; i < files.length; i++) {
        while ((result = cqlRegex.exec(files[i])) !== null) {
            batchQueries.push(result[1].replace(/\s+/g, ' ').trim());
        }
    }

    callback(null, true);
};

/**
 * Initializes the query batch to execute.
 * @param  {Function} callback Callback to async with error or success
 */
var runQueries = function(callback) {

    output("Initializing queries...");

    if (program.keyspace) {
        batchQueries.unshift("USE " + program.keyspace + ";");
    }

    if (batchQueries && batchQueries.length > 0) {
        output("Running queries...");
        executeQuery(batchQueries.shift(), callback);
    } else {
        callback("No queries to run.", null);
    }
};

/**
 * A recursive method, that executes each query.
 * @param  {String} eQuery The cql string to be executed.
 * @param  {Function} callback Callback to async with error or success
 */
var executeQuery = function(eQuery, callback) {

    output("Executing:\t\t" + eQuery);

    cassandraClient.execute(eQuery, function(err) {
        if (err) {
            return callback(err, null);
        } else {
            if (batchQueries.length > 0) {
                executeQuery(batchQueries.shift(), callback);
            } else {
                callback(null, true);

                process.nextTick(function() {
                    process.exit(1);
                });
            }
        }
    });
};

/**
 * Output messages to console if not running silent.
 * @param  {[type]} msg [description]
 * @return {[type]}     [description]
 */
var output = function(msg) {
    if (!program.silent) {
        console.log(msg);
    }
}

output("Initializing CQL Runner...");

/**
 * Async series to control execution
 */
async.series([
        function(callback) {
            startCassandra(callback);
        },
        function(callback) {
            processArguments(callback);
        },
        function(callback) {
            loadFiles(callback);
        },
        function(callback) {
            processQueries(callback);
        },
        function(callback) {
            runQueries(callback);
        }
    ],
    function(err, result) {
        if (err) {
            console.log(err);
            process.exit(1);
        } else {
            output("CQL Runner Complete!");
            process.exit(0);
        }
    }
);