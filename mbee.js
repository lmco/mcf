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
var M = { env: process.env.NODE_ENV || 'dev' };
M.version = require(__dirname + '/package.json')['version'];
M.config  = require(__dirname + `/config/${M.env}.json`);
M.root = __dirname;
M.path = {
    lib:         (s) => {return path.join(__dirname, 'app', 'lib', s)},
    controllers: (s) => {return path.join(__dirname, 'app', 'controllers', s)},
    models:      (s) => {return path.join(__dirname, 'app', 'models', s)}
};

//M.util = {
//    /**
//     * Takes a list of items, A, and a list of mutually exclusive items, B. 
//     * Returns false if than one item from B is found in A, true otherwise.
//     */
//    mutuallyExclusive: (A, B) => {
//        let flags = 0;
//        for (let i = 0; i < list.length; i++) {
//            if (args.includes(list[i])) {
//                flags++;
//                if (flags > 1) 
//                    throw new Error('Too many mutually exclusive arguments.');
//            }
//        }
//    }
//}

M.load = (m) => {return require(path.join(__dirname, 'app', m)) };

// This exports the basic MBEE version and config data so that modules may
// have access to that data when they are loaded. 
// Other MBEE modules like lib and controllers are loaded after this.
// That means that modules should not try to call other modules when they are
// loaded. They can, however, call other modules later because the 'mbee' object
// is re-exported after the modules loading is complete (see below)
//module.exports = mbee;
module.exports = M;

// If dependecies have been installed, initialize the MBEE helper object
if (fs.existsSync(__dirname + '/node_modules')) {
    initialize()
}

const build = require(__dirname + '/scripts/build');

// Call main
if (module.parent == null) {
    //try {
        main();
    //}
    //catch (error) {
    //    console.log(error);
    //    console.log('An error occurred. Try running "node mbee install".');
    //    process.exit(1);
    //}    
} 
// Re-export mbee after initialization
else {
    module.exports = M;
}


/******************************************************************************
 *  Main Function                                                             *
 ******************************************************************************/

function main() 
{
    var subcommand = process.argv.slice(2,3)[0];
    var opts = process.argv.slice(3);
    var tasks = {
        'build':     build.build,
        'clean':     clean,
        'docker':    docker,
        'install':   build.install,
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
 * Cleans project directory of non-persistent items. Removes the following 
 * artifacts of a build: the public directory, the docs directory, logs, and 
 * node_modules. The following flags are supported: `--logs`, `--docs`, 
 * `--public`, `--node-modules`, and `--all`. The default behavior if no 
 * arguments are given is to delete all items except the node_modules directory.
 *
 * TODO - Make this robust against missing node_modules directory and keep it
 * cross-platform.
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
 * The Docker command can be used to build a Docker image or run a Docker 
 * container. It supports the command line arguments `--build` and `--run` to 
 * build the image or run the conatiner respectively. Both of these options 
 * expect configuration parameters to be defined in the Docker section of the 
 * config.json file. The `--build` and `--run` commands are not mutually 
 * exclusive, if run together the Docker image is built and then the container
 * is run.
 */

function docker(args) 
{
    // Build the Docker image
    if (args.includes('--build')) {
        build();  // First, build MBEE 
        console.info('Building Docker Image ...');
        
        // Build docker by running: "docker build -f .../Dockerfile -t mbee ."
        let buildArgs = [                           // Create the build args
            'build', 
            '-f', M.config.docker.Dockerfile, 
            '-t', M.config.docker.image.name, '.'
        ];
        let cmd = spawn('docker', buildArgs, {stdio: 'inherit'});       // Run the build process
        cmd.stdout.on('data', function (data) {     
            console.log(data.toString());           // Print stdout
        });
        cmd.stderr.on('data', function (data) {
            console.error(data.toString());         // Print stderr
        });
        cmd.on('exit', function (code) {            
            if (code != 0) {                        // Fail if exit code != 0
                console.log('Docker build failed');
                process.exit(code);
            }
            else {                                  // Log successful build 
                console.log('Docker Image Built.');
            }
        });
    }

    // Run the Docker container
    if (args.includes('--run')) {
        console.log('Running Docker Container ...');

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
        let cmd = spawn('docker', rargs, {stdio: 'inherit'});
        cmd.stdout.on('data', (data) => { console.log(data.toString()); });
        cmd.stderr.on('data', (data) => { console.error(data.toString()); });
        cmd.on('exit', function (code) {
            if (code != 0) {
                console.log('Docker run failed');
                process.exit(code);
            }
        });
        console.log('Docker Container Running in Background.');
    }
}




/**
 * Runs the MBEE server based on the configuration provided in the environment
 * config file. 
 */

function start(args) 
{
    initialize();
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
    if (M.config.server.https.enabled) {
        var keyPath = path.join('certs', `${M.config.server.https.sslCertName}.key`);
        var crtPath = path.join('certs', `${M.config.server.https.sslCertName}.crt`);
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
 * Runs the collection of test suites by running the "test/runner.js" script
 * with Mocha.
 */
function test(args) 
{
    let mocha = './node_modules/.bin/mocha';
    let margs = ['test/runner.js', '--slow', '19'];

    console.log(args);

    mocha = 'ls'
    margs = ['-lh']
    let cmd = spawn(mocha, margs, {stdio: 'inherit'});

    console.log(cmd)

    cmd.stdout.on('data', function(data) { 
        console.log(data.toString()); 
    });
    cmd.stderr.on('data', function(data) { 
        console.error(data.toString()); 
    });
    cmd.on('close', function (code) {
        if (code != 0) {
            console.log('Tests failed.');
            process.exit(code);
        }
    });
}


/**
 * Initializes the global MBEE helper object. This is defined in it's own 
 * function because it may be called at the end of install to re-load the MBEE
 * global helper object.
 */

function initialize(args) 
{
    M.log = M.load('lib/logger');
    M.lib = {
        crypto:     M.load('lib/crypto'),
        db:         M.load('lib/db'),
        sani:       M.load('lib/sanitization'),
        startup:    M.load('lib/startup'),
        validators: M.load('lib/validators')
    }
}
