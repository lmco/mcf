#!/usr/bin/env node
/*****************************************************************************
 * Classification: UNCLASSIFIED                                              *
 *                                                                           *
 * Copyright (C) 2018, Lockheed Martin Corporation                           *
 *                                                                           *
 * LMPI WARNING: This file is Lockheed Martin Proprietary Information.       *
 * It is not approved for public release or redistribution.                  *
 *                                                                           *
 * EXPORT CONTROL WARNING: This software may be subject to applicable export *
 * control laws. Contact legal and export compliance prior to distribution.  *
 *****************************************************************************/
/*
 * mbee.js
 * 
 * Josh Kaplan <joshua.d.kaplan@lmco.com>
 *
 * This file defines and implements the MBEE server functionality.
 */

// Node.js Built-in Modules 
const fs = require('fs');
const http = require('http');
const https = require('https');
const path = require('path');
const { execSync, spawn, spawnSync } = require('child_process');

// Global MBEE helper object
var mbee = { env: process.env.NODE_ENV || 'dev' };
mbee.version = require(__dirname + '/package.json')['version'];
mbee.config  = require(__dirname + `/config/${mbee.env}.json`);
mbee.paths = {
    lib:         (s) => {return path.join(__dirname, 'app', 'lib', s);},
    controllers: (s) => {return path.join(__dirname, 'app', 'controllers', s);},
    models:      (s) => {return path.join(__dirname, 'app', 'models', s);}
};

// This exports the basic MBEE version and config data so that modules may
// have access to that data when they are loaded. 
// Other MBEE modules like lib and controllers are loaded after this.
// That means that modules should not try to call other modules when they are
// loaded. They can, however, call other modules later because the 'mbee' object
// is re-exported after the modules loading is complete (see below)
module.exports = mbee;

// If dependecies have been installed, initialize the MBEE helper object
if (fs.existsSync(__dirname + '/node_modules')) {
    initialize()
}

// Call main
if (module.parent == null) {
    try {
        main();
    }
    catch (error) {
        console.log(error);
        console.log('An error occurred. Try running "node mbee install".');
        process.exit(1);
    }    
} 
// Re-export mbee after initialization
else {
    module.exports = mbee;
}


/******************************************************************************
 *  Main Function                                                             *
 ******************************************************************************/

function main() 
{
    var subcommand = process.argv.slice(2,3)[0];
    var opts = process.argv.slice(3);
    var tasks = {
        'build':     build,
        'clean':     clean,
        'configure': configure,
        'docker':    docker,
        'install':   install,
        'server':    runServer,
        'start':     start,
        'test':      test
    };

    if (tasks.hasOwnProperty(subcommand))
        tasks[subcommand](opts) 
    else
        console.log('Unknown command.')
}


/******************************************************************************
 *  Task Functions                                                            *
 ******************************************************************************/


/**
 * Builds the project by copy dependencies to their final location, compiling 
 * Sass into CSS, building Javascript libraries into client-side code, and
 * building developer documentation. Installs dev dependencies first. Accepts
 * the following command-line parameters: `--copy-deps`, `--sass`, `--react`, 
 * `--jsdoc`, and `--all`. No arguments defaults to `--all`.
 */

function build(args) 
{
    install(['--dev']);                 // Install development dependencies
    mbee.log.info('Building MBEE ...'); 

    let gulp   = require('gulp');
    let concat = require('gulp-concat');
    let sass    = require('gulp-sass');
    let react   = require('gulp-react');

    // Allow the function to be called with no parameters
    // Set the default behavior to build all
    if (args == undefined || args.length == 0) {
        args = ['--all'];
    }

    // This executes the default build process with Gulp.
    if (args.includes('--all') || args.includes('--copy-deps')) {
        // Copy images
        gulp.src('./app/ui/img/**/*')
            .pipe(gulp.dest('public/img'));
        // Copy React
        gulp.src('./node_modules/react/umd/react.production.min.js')
            .pipe(react())
            .pipe(concat('react.min.js'))
            .pipe(gulp.dest('public/js'));
        // Copy ReactDOM
        gulp.src('./node_modules/react-dom/umd/react-dom.production.min.js')
            .pipe(react())
            .pipe(concat('react-dom.min.js'))
            .pipe(gulp.dest('public/js'));
        // Copy Swagger CSS
        gulp.src('./node_modules/swagger-ui-express/static/*.css')
            .pipe(gulp.dest('public/css'));
        // Copy Swagger JS
        gulp.src('./node_modules/swagger-ui-express/static/*.js')
            .pipe(gulp.dest('public/js'));
    }

    // Build Sass into CSS
    if (args.includes('--all') || args.includes('--sass')) {
        gulp.src('./app/ui/sass/**/*.scss')
            .pipe(sass({outputStyle: 'compressed'})
            .on('error', sass.logError))
            .pipe(gulp.dest('./public/css'));
    }

    // Builds the React libraries into client-side JS
    if (args.includes('--all') || args.includes('--react')) {
        // Build React
        gulp.src('./app/ui/react-components/**/*.jsx')
            .pipe(react())
            .pipe(concat('mbee.js'))
            .pipe(gulp.dest('public/js'));
        // Build ReactDOM
        gulp.src('./app/ui/react-renderers/**/*.jsx')
            .pipe(react())
            .pipe(gulp.dest('public/js')); 
    }

    // Build JSDoc
    if (args.includes('--all') || args.includes('--jsdoc')) {
        let jsdoc  = 'node_modules/jsdoc/jsdoc.js'; 
        let src    = 'out';
        let dst    = 'docs';
        let tmpl   = '-t node_modules/ub-jsdoc/';
        let files  = ['app/*'].join(' ');
        let cmd    = [
            `node ${jsdoc} ${tmpl} ${files}`,
            `rm -rf ${dst}/*`,
            `mv ${src} ${dst}`
        ].join(' && ');
        let stdout = execSync(cmd);
    }
    mbee.log.info('Build Complete.');
    return;
}


/**
 * Cleans project directory of non-persistent items. Removes the following 
 * artifacts of a build: the public directory, the docs directory, logs, and 
 * node_modules. The following flags are supported: `--logs`, `--docs`, 
 * `--public`, `--node-modules`, and `--all`. The default behavior if no 
 * arguments are given is to delete all items except the node_modules directory.
 */

function clean(args) 
{
    let del = require('del');

    // Allow the function to be called with no parameters
    // Set the default behavior to build all
    if (args == undefined) 
        args = [];

    // Clean logs
    if (args.length == 0 || args.includes('--all') || args.includes('--logs')) 
        del.sync(['*.log', 'logs/*.logs']);

    // Clean docs
    if (args.length == 0 || args.includes('--all') || args.includes('--docs')) 
        del.sync(['docs']);

    // Clean public
    if (args.length == 0 || args.includes('--all') || args.includes('--public')) 
        del.sync(['public']);

    // Clean node_modules
    if (args.includes('--all') || args.includes('--node-modules')) 
        del.sync(['node_modules']);
}


/**
 * Configures the system for build. The main purpose is to ensure that Yarn is 
 * installed. If not, it is installed using NPM. If Yarn configuration 
 * parameters are defined in the config.json file, Yarn is configured with 
 * those key/value pairs.
 */

function configure() 
{
    console.log('Configuring build system ...');

    // Make sure Yarn is installed
    let yarnPath = execSync('which yarn').toString().replace('\n', '');
    if(!fs.existsSync(yarnPath)) {
        console.log('Instaling yarn ...')
        let cmd = spawnSync('npm', ['install', '-g', 'yarn']);
        if (cmd.stdout)
            console.log(cmd.stdout.toString());
        if (cmd.stderr && cmd.stderr.toString().trim() !== '') 
            console.error(cmd.stderr.toString());
        if (cmd.status != 0) 
            process.exit(cmd.status || -1);
    }

    // Configure Yarn - loop over config options and configure Yarn
    if (mbee.config.hasOwnProperty['yarn']) {
        let keys = Object.keys(mbee.config.yarn);
        for (let i = 0; i < keys.length; i++) {
            let key = keys[i];
            let val = mbee.config.yarn[key];

            // Check if config is already set, if so. Don't mess with it. 
            let cmd = spawnSync('yarn', ['config', 'get', `${key}`]);
            if (cmd.stdout) 
                if (cmd.stdout.toString().replace('\n', '').trim() == val)
                    continue;
            if (cmd.stderr && cmd.stderr.toString().trim() !== '') 
                console.log(cmd.stderr.toString());
            if (cmd.status != 0)
                process.exit(cmd.status || -1);

            // Execute the 'yarn config' command
            cmd = spawnSync('yarn', ['config', 'set', `${key}`, val]);
            if (cmd.stdout)
                console.log(cmd.stdout.toString());
            if (cmd.stderr && cmd.stderr.toString().trim() !== '')
                console.log(cmd.stderr.toString());
            if (cmd.status != 0)
                process.exit(cmd.status || -1);
        }
    }
    console.log('Configuration complete.');
    return;
}


/**
 * The Docker command can be used to build a Docker image or run a Docker 
 * container. It supports the mutually exclusive command line arguments 
 * `--build` and `--run` to build the image or run the conatiner respectively.
 * Both of these options expect configuration parameters to be defined in the
 * Docker section of the config.json file.
 */

function docker(args) 
{
    // Sanity check on mutually exclusive args
    mutuallyExclusive(args, ['--build', '--run']);

    // Build the Docker image
    if (args.includes('--build')) {
        build();  // First, build MBEE 
        mbee.log.info('Building Docker Image ...');
        
        // Build docker by running: "docker build -f .../Dockerfile -t mbee ."
        let buildArgs = [                           // Create the build args
            'build', 
            '-f', mbee.config.docker.Dockerfile, 
            '-t', mbee.config.docker.image.name, '.'
        ];
        let cmd = spawn('docker', buildArgs);       // Run the build process
        cmd.stdout.on('data', function (data) {     
            console.log(data.toString());           // Print stdout
        });
        cmd.stderr.on('data', function (data) {
            console.error(data.toString());         // Print stderr
        });
        cmd.on('exit', function (code) {            
            if (code != 0) {                        // Fail if exit code != 0
                mbee.log.error('Docker build failed');
                process.exit(code);
            }
            else {                                  // Log successful build 
                mbee.log.info('Docker Image Built.');
            }
        });
    }

    // Run the Docker container
    else if (args.includes('--run')) {
        mbee.log.info('Running Docker Container ...');

        // Build the "docker run" command
        let server = mbee.config.server;
        let docker = mbee.config.docker;
        let rargs = [
            'run', 
            '-d',
            '-it',
            '--restart=always'
        ];
        if (server.http.enabled && docker.http.enabled) {
            rargs = rargs.concat(['-p', `${docker.http.port}:${server.http.port}`]);
        }
        if (server.https.enabled && docker.https.enabled) {
            rargs = runArgs.concat(['-p', `${docker.https.port}:${server.https.port}`]);
        }
        rargs = rargs.concat(['--name', mbee.config.docker.container.name])
        rargs = rargs.concat([mbee.config.docker.image.name])
        console.log(rargs)

        // Run the Docker container
        let cmd = spawn('docker', rargs);
        cmd.stdout.on('data', function (data) {
            console.log(data.toString());
        });
        cmd.stderr.on('data', function (data) {
            console.error(data.toString());
        });
        cmd.on('exit', function (code) {
            if (code != 0) {
                mbee.log.error('Docker run failed');
                process.exit(code);
            }
        });
        mbee.log.info('Docker Container Running in Background.');
    }
}


/**
 * Installs dependencies for MBEE. First, Yarn is configured via the configure 
 * function. Then dependencies are installed via "yarn install". If the "--dev" 
 * argument is specified, development dependencies are also installed. 
 */

function install(args) 
{
    console.log('Installing dependencies ...');
    configure(); // Make sure Yarn is installed and configured

    // Safely allow install to be called with no args
    if (args == undefined) {
        args = [];
    }

    let cmd = spawnSync('yarn', ['install'].concat(args));
    if (cmd.stdout) {
        console.log(cmd.stdout.toString());
    }
    if (cmd.stderr && cmd.stderr.toString().trim() !== '') {
       console.error(cmd.stderr.toString());
    }
    if (cmd.status != 0) {  
        process.exit(cmd.status || -1);
    }

    // Init the MBEE helper object and return.
    initialize();
    mbee.log.info('Dependencies installed succesfully.');
    return;
}


/**
 * Runs the MBEE server based on the configuration provided in the environment
 * config file. 
 */

function runServer(args) 
{
    mbee.log.debug(`+ mbee.js executed as ${process.argv.join(' ')} ` 
                    + `with env=${mbee.env} and configuration: ` 
                    + JSON.stringify(mbee.config));

    var app = require(__dirname + '/app/app.js');   // Import the app
    mbee.lib.startup();                             // Print startup banner

    // Create HTTP Server
    if (mbee.config.server.http.enabled) {
        var httpServer = http.createServer(app);
    }

    // Create HTTPS Server
    if (mbee.config.server.https.enabled) {
        var keyPath = path.join('certs', `${mbee.config.server.https.sslCertName}.key`);
        var crtPath = path.join('certs', `${mbee.config.server.https.sslCertName}.crt`);
        var privateKey  = fs.readFileSync(path.join(__dirname, keyPath), 'utf8');
        var certificate = fs.readFileSync(path.join(__dirname, crtPath), 'utf8');
        var credentials = {key: privateKey, cert: certificate};
        var httpsServer = https.createServer(credentials, app);
    }

    // Run HTTP Server
    if (mbee.config.server.http.enabled) {
        httpServer.listen(mbee.config.server.http.port, function() {
            let port = mbee.config.server.http.port;
            mbee.log.info('MBEE server listening on port ' + port + '!')
        });
    }

    // Run HTTPS Server
    if (mbee.config.server.ssl) {
        httpsServer.listen(mbee.config.server.https.port, function() {
            let port = mbee.config.server.https.port;
            mbee.log.info('MBEE server listening on port ' + port + '!')
        });   
    }
}


/**
 * "start": "yarn install && yarn run build && yarn run server",
 */
function start(args) 
{
    build();
    runServer();
}


/**
 * "test": "./node_modules/.bin/mocha test/_orchestrator.js --slow 19"
 */
function test(args) 
{
    console.log(args)
}


/******************************************************************************
 * Helper Functions                                                           *
 ******************************************************************************/

/**
 * This function can be used as a sanity check on mutually exclusive arguments.
 * The 'args' paramater is the full list of arguments that we need to verify.
 * The 'list' parameter is the list of mutually exclusive arguments. If two
 * arguments that are mutually exclusive are found in the args array, an error
 * is thrown.
 */

function mutuallyExclusive(args, list) {
    let flags = 0;
    for (let i = 0; i < list.length; i++) {
        if (args.includes(list[i])) {
            flags++;
            if (flags > 1) {
                throw new Error('Mutually exclusive arguments called together.')
            }
        }
    }
}



/**
 * Initializes the global MBEE helper object. This is defined in it's own 
 * function because it may be called at the end of install to re-load the MBEE
 * global helper object.
 */

function initialize(args) 
{
    mbee.log = require(mbee.paths.lib('logger.js'));
    mbee.lib = {
        crypto:     require(mbee.paths.lib('crypto.js')),
        db:         require(mbee.paths.lib('db.js')),
        sani:       require(mbee.paths.lib('sanitization.js')),
        startup:    require(mbee.paths.lib('startup.js')),
        validators: require(mbee.paths.lib('validators.js'))
    }
}
