var path = require('path'),
    fs = require('fs'),
    gulp = require('gulp'),
    apidoc = require('gulp-apidoc'),
    istanbul = require('gulp-istanbul'),
    jshint = require('gulp-jshint'),
    mocha = require('gulp-mocha'),
    plato = require('gulp-plato'),
    preprocess = require('gulp-preprocess'),
    runSequence = require('run-sequence'),
    coverageEnforcer = require('gulp-istanbul-enforcer'),
    tap = require('gulp-tap'),
    spawn = require('child_process').spawn,
    gutil = require('gulp-util'),
    del = require('del'),
    SERVER_SOURCES = [
        './server/models/**/*.js',
        './server/lib/**/*.js',
        './server/services/**/*.js',
        './server/middleware/**/*.js',
        './server/routers/**/*.js',
        './server/app.js'
    ],
    CLIENT_SOURCES = [
        './client/js/**/*.js'
    ],
    isWatching = false; //If we are watching, set this to true in the watch method

/**
 * Creates git hooks to run jshint on commits and test coverage on push
 */
gulp.task('updateGitHooks', function(cb) {
    var hookFiles = ['./scripts/git/hooks/pre-push.js', './scripts/git/hooks/pre-commit.js'],
        i,
        file,
        hookFile,
        hookName,
        hookPath,
        re = /[^/]+.js/i;

    for (i = 0; i < hookFiles.length; i++) {
        hookFile = re.exec(hookFiles[i])[0];
        hookName = hookFile.split('.')[0];
        hookPath = path.resolve('.git/hooks/' + hookName);
        file = fs.readFileSync(hookFiles[i]);
        fs.writeFileSync(hookPath, file);
        fs.chmodSync(hookPath, '755');

        console.log("Created " + hookName + " hook.");
    }

    cb();
});

//Set the environment variable to test for the gulp process ONLY
gulp.task('env:test', function(cb) {
    process.env.NODE_ENV = "test";
    cb();
});

//Set the environment variable to development for the gulp process ONLY
gulp.task('env:dev', function(cb) {
    process.env.NODE_ENV = "development";
    cb();
});

//Set the environment variable to staging for the gulp process ONLY
gulp.task('env:stg', function(cb) {
    process.env.NODE_ENV = "staging";
    cb();
});

//Set the environment variable to production for the gulp process ONLY
gulp.task('env:prod', function(cb) {
    process.env.NODE_ENV = "production";
    cb();
});


/**
 * Clean up files as needed
 */
//Remove previous code coverage files
gulp.task('clean:coverage', function(cb) {
    del(['./documentation/coverage'], cb);
});

//Remove previous code quality reports files
gulp.task('clean:qualityReport', function(cb) {
    del(['./documentation/quality'], cb);
});

//Remove previous generated api docs
gulp.task('clean:docs', function(cb) {
    del(['./documentation/docs'], cb);
});

//Remove previous public files
gulp.task('clean:public', function(cb) {
    del(['./server/public'], cb);
});

/**
 * Runs jshint on the source and client files
 */
//Run jshint on the server code
gulp.task('jshint:server', function(cb) {
    return gulp.src(SERVER_SOURCES)
        .pipe(jshint('.jshintrc'))
        .pipe(jshint.reporter('jshint-stylish'))
        .pipe(jshint.reporter('fail'));
});

//Run jshint on the client code
gulp.task('jshint:client', function(cb) {
    return gulp.src(CLIENT_SOURCES)
        .pipe(jshint('.jshintrc'))
        .pipe(jshint.reporter('jshint-stylish'))
        .pipe(jshint.reporter('fail'));
});

/*
 * The process gets stuck. This quits it.
 */
gulp.on('stop', function() {
    if (!isWatching) {
        process.nextTick(function() {
            process.exit(0);
        });
    }
});

/*
Genereates documentation
 */
gulp.task('apidoc', function() {
    apidoc.exec({
        src: './server/routers/',
        dest: './documentation/api/'
    });
});

gulp.task('enforce-server-coverage', function(cb) {
    var options = {
        thresholds: {
            statements: 60,
            branches: 60,
            lines: 60,
            functions: 60
        },
        coverageDirectory: './documentation/coverage/server',
        rootDirectory: ''
    };
    gulp
        .src('.')
        .pipe(coverageEnforcer(options))
        .on('end', cb);
});

//Does a complete test cleanup, runs jshint on node.js code, runs tests and generates coverage reports.
gulp.task('run-server-coverage', function(cb) {
    gulp.src(SERVER_SOURCES, {
            base: './server'
        })
        .pipe(istanbul())
        .pipe(gulp.dest('./documentation/coverage/server/src'))
        .on('end', function() {
            return gulp.src(['./server/test/**/*.js'])
                .pipe(mocha({
                    reporter: 'spec',
                    timeout: 30000
                }))
                .pipe(istanbul.writeReports('./documentation/coverage/server'))
                .on('end', cb);
        });
});


gulp.task('setup', function(cb) {
    runSequence('resetAppDB', 'initAppDB', function() {
        cb();
    });
});

gulp.task('coverage', function(cb) {
    runSequence('env:test', 'resetTestDB', 'initTestDB', 'clean:coverage', 'run-server-coverage', 'enforce-server-coverage', cb);
});

//Run the tests only.
gulp.task('test', function(cb) {
    runSequence('env:test', 'resetTestDB', 'initTestDB', 'test_internal', cb);
});

// gulp.task('build', function(cb) {
//     runSequence('env:prod', 'clean:public', 'build:optimizeJS', 'build:moveFiles', 'build:optimizeMainCSS', 'build:minifyMainCSS', 'build:optimizeSetupCSS', 'build:minifySetupCSS', cb);
// });

//Not meant to be run by itself, but in 'test'. run-sequence doesn't like it if its in the callback as it hangs.
gulp.task('test_internal', function(cb) {
    return gulp.src(['./server/test/**/*.js'])
        .pipe(mocha({
            reporter: 'spec',
            timeout: 30000
        }));
});

gulp.task('report', function() {
    return gulp.src(SOURCES)
        .pipe(plato('reports/quality', {
            jshint: {
                options: {
                    strict: true
                }
            },
            complexity: {
                trycatch: true
            }
        }));
});

gulp.task('resetAppDB', function(cb) {
    spawnProcess('node', ['./server/tools/CQL', '-sf', '../cql/resetAppKeyspace.cql'], cb);
});

gulp.task('initAppDB', function(cb) {
    spawnProcess('node', ['./server/tools/CQL', '-k', 'peaposy_test', '-sf', '../cql/setupDB.cql'], cb);
});

gulp.task('resetTestDB', function(cb) {
    spawnProcess('node', ['./server/tools/CQL', '-sf', '../test/cql/resetTestKeyspace.cql'], cb);
});

gulp.task('initTestDB', function(cb) {
    spawnProcess('node', ['./server/tools/CQL', '-k', 'peaposy_test', '-sf', '../cql/setupDB.cql'], cb);
});

function spawnProcess(cmd, args, callback) {
    var child = spawn(cmd, args, {
            cwd: process.cwd()
        }),
        stdout = '',
        stderr = '';

    child.stdout.setEncoding('utf8');
    child.stdout.on('data', function(data) {
        stdout += data;
    });

    child.stderr.setEncoding('utf8');
    child.stderr.on('data', function(data) {
        stderr += data;
    });
    child.on('close', function(code) {
        if (callback) {
            callback();
        }
    });
}

gulp.task('default', ['apidoc', 'jshint:server', 'coverage']);
gulp.task('commit', ['jshint:server']);
gulp.task('setup', ['updateGitHooks']);
