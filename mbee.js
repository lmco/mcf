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

// If dependecies have been installed, load up the rest of the modules
if (fs.existsSync(__dirname + '/node_modules')) {
    mbee.log = require(mbee.paths.lib('logger.js'));
    mbee.lib = {
        crypto:     require(mbee.paths.lib('crypto.js')),
        db:         require(mbee.paths.lib('db.js')),
        sani:       require(mbee.paths.lib('sanitization.js')),
        startup:    require(mbee.paths.lib('startup.js')),
        validators: require(mbee.paths.lib('validators.js'))
    }
}

// Call main
if (module.parent == null) {
    mbee.log.debug(`+ mbee.js executed as ${process.argv.join(' ')} ` 
                    + `with env=${mbee.env} and configuration: ` 
                    + JSON.stringify(mbee.config));
    main();
} 
// Re-export mbee
else {
    module.exports = mbee;
}


/**************************************
 *  Main Function                     *
 **************************************/

function main() 
{
    var subcommand = process.argv.slice(2,3)[0];
    var opts = process.argv.slice(3);
    var tasks = {
        'build':    buildCommand,
        'clean':    cleanCommand,
        'db':       dbCommand,
        'docker':   dockerCommand,
        'install':  installCommand,
        'server':   serverCommand,
        'start':    startCommand,
        'test':     testCommand
    };

    if (tasks.hasOwnProperty(subcommand))
        tasks[subcommand](opts) 
    else
        console.log('Unknown command.')
}


/**************************************
 *  Task Functions                    *
 **************************************/

 /**
 * "build": "./node_modules/.bin/gulp",
 * "build:jsdoc": "node node_modules/jsdoc/jsdoc.js -t node_modules/ub-jsdoc/ app/* && mv out docs",
 * "build:jsdoc-old": "./node_modules/.bin/gulp jsdoc",
 */
function buildCommand(args) 
{
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
    if (args.includes('--all')) {
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

        // Build Sass
        gulp.src('./app/ui/sass/**/*.scss')
        .pipe(sass({outputStyle: 'compressed'})
        .on('error', sass.logError))
        .pipe(gulp.dest('./public/css'));

        // Build React
        gulp.src('./app/ui/react-components/**/*.jsx')
        .pipe(react())
        .pipe(concat('mbee.js'))
        .pipe(gulp.dest('public/js'));

        // Build ReactDOM
        gulp.src('./app/ui/react-renderers/**/*.jsx')
        .pipe(react())
        .pipe(gulp.dest('public/js'));

        // Copy Swagger CSS
        gulp.src('./node_modules/swagger-ui-express/static/*.css')
        .pipe(gulp.dest('public/css'));

        // Copy Swagger JS
        gulp.src('./node_modules/swagger-ui-express/static/*.js')
        .pipe(gulp.dest('public/js'));
    }
}


function cleanCommand(args) 
{
    let del = require('del');

    // Allow the function to be called with no parameters
    // Set the default behavior to build all
    if (args == undefined) {
        args = ['--all'];
    }

    // Clean logs
    if (args.length == 0 || args.includes('--all') || args.includes('--logs')) 
        del(['*.log', 'logs/*.logs']);

    // Clean docs
    if (args.length == 0 || args.includes('--all') || args.includes('--docs')) 
        del(['docs']);

    // Clean public
    if (args.length == 0 || args.includes('--all') || args.includes('--public')) 
        del(['public']);

    // Clean node_modules
    if (args.includes('--all') || args.includes('--node-modules')) 
        del(['node_modules']);

}



/**************************************
 *  Other Functions                   *
 **************************************/


/**
 * "build": "./node_modules/.bin/gulp",
 * "build:jsdoc": "node node_modules/jsdoc/jsdoc.js -t node_modules/ub-jsdoc/ app/* && mv out docs",
 * "build:jsdoc-old": "./node_modules/.bin/gulp jsdoc",
 */
function buildCommandOld(args) {

    // Allow the function to be called with no parameters
    if (args == undefined) {
        args = [];
    }

    // This executes the default build process with Gulp.
    if (args.length == 0) {
        let gulp     = `${__dirname}/node_modules/.bin/gulp`
        let gulpfile = `${__dirname}/scripts/Gulpfile.js`;
        let cmd      = `${gulp} --gulpfile ${gulpfile} --color`;
        let stdout   = execSync(cmd);
        console.log(stdout.toString());
        return;
    }

    var subcommand = args.slice(0,1)[0];

    switch(subcommand) {
        case 'jsdoc':
            let jsdoc  = 'node_modules/jsdoc/jsdoc.js'; 
            let src    = 'out';
            let dst    = 'docs';
            let tmpl   = '-t node_modules/ub-jsdoc/'
            let cmd    = `node ${jsdoc} ${tmpl} app/* && mv ${src} ${dst}`
            let stdout = execSync(cmd);
            console.log(stdout.toString());
            break;
        default: 
            console.log('Unknown command.')

    }
}


/**
 * "clean": "./node_modules/.bin/gulp clean",
 * "clean:all": "rm -rf public/ node_modules/ docs/",
 */
function cleanCommandOld(args) {
    let gulp     = `${__dirname}/node_modules/.bin/gulp`
    let gulpfile = `${__dirname}/scripts/Gulpfile.js`;
    let cmd      = `${gulp} clean --gulpfile ${gulpfile} --color`;
    let stdout   = execSync(cmd);
    console.log(stdout.toString());

    if (args.includes('--all')) {
        let cmd = 'rm -rf public/ node_modules/ docs/'
        console.log(`Executing ${cmd} ...`)
        let stdout = execSync(cmd);
        console.log(stdout.toString());
    }
    return;
}

/**
 * Installs Yarn and then configures it.
 */
function configureCommand() {
    // Make sure Yarn is installed
    let cmd = spawnSync('npm', ['install', '-g', 'yarn']);

    cmd.stdout.on('data', function (data) {
        console.log(data.toString());
    });

    cmd.stderr.on('data', function (data) {
        console.error(data.toString());
    });

    cmd.on('exit', function (code) {
        if (code != 0) {
            mbee.log.error('')
            process.exit(code);
        }
      console.log('child process exited with code ' + code.toString());
    });

    // Install dependencies using yarn
    console.log('Doing yarn install (not really) ...')
    //stdout = execSync('yarn install');
    //console.log(stdout.toString());
    return;
}

/**
 * [configureYarn description]
 * @return {[type]} [description]
 */
function configureYarn() {

}


/**
 * "db": "mongod --auth --dbpath ./db/mbee"
 */
function dbCommand(args) {
    console.log(args)
}

/**
 * "docker:build": "yarn install && yarn build && docker build -t mbee .",
 * "docker:run:dev": "docker run -d -it --restart=always -p 9080:9080 -p 9443:9443 --name mbee-dev mbee",
 * "docker:run": "docker run -d -it --restart=always -p 80:9080 -p 443:9443 --name mbee mbee",
 */
function dockerCommand(args) {
    console.log(args)
}


/**
 * Installs dependencies.
 */
function installCommand() {
    // Make sure Yarn is installed
    let cmd = spawnSync('npm', ['install', '-g', 'yarn']);
    //let stdout = execSync('npm install -g yarn');
    //console.log(stdout.toString());

    console.log(cmd)
    cmd.stdout.on('data', function (data) {
      console.log(data.toString());
    });

    //cmd.stderr.on('data', function (data) {
    //  console.error(data.toString());
    //});

    //cmd.on('exit', function (code) {
    //  console.log('child process exited with code ' + code.toString());
    //});

    // Install dependencies using yarn
    console.log('Doing yarn install (not really) ...')
    //stdout = execSync('yarn install');
    //console.log(stdout.toString());
    return;
}


/**
 * "server": "node ./bin/server.js",
 * "server:jsdoc": "./node_modules/.bin/gulp jsdoc && node ./bin/jsdoc-server.js",
 */
function serverCommand(args) 
{
    const express = require('express');
    const session = require('express-session');
    const MongoStore = require('connect-mongo')(session);
    const cookieParser = require('cookie-parser');
    const bodyParser = require('body-parser');
    const mongoose = require('mongoose');

   var mutuallyExclusive = function(args, list) {
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
    mutuallyExclusive(args, [ '--api-only', '--ui-only', '--plugins-only' ]);
    mutuallyExclusive(args, [ '--api-only', '--no-api' ]);
    mutuallyExclusive(args, [ '--ui-only', '--no-ui' ]);
    mutuallyExclusive(args, [ '--plugins-only', '--no-plugins' ]);
    var state = { api: true, ui: true, plugins: true }

    // Handle the --*-only CLI args
    if (args.includes('--api-only')) {
        state =  { api: true, ui: false, plugins: false }
    }
    else if (args.includes('--ui-only')) { 
        state = { api: false, ui: true, plugins: false }
    }
    else if (args.includes('--plugins-only')) {
        state = { api: false, ui: false, plugins: true }
    }

    // Handle the --no-* CLI args
    if (args.includes('--no-api')) 
        state.api = false;
    if (args.includes('--no-ui'))
        state.ui = false;
    if (args.includes('--no-plugins')) 
        state.plugins = false;
    
   
    /**************************************
     *  Configuration & Middleware        *          
     **************************************/
    
    // Initializes our application
    const app = express();

    // Connect to the database 
    mbee.lib.db.connect();

    // This allows us to receive JSON data in the  request body
    app.use(bodyParser.json()); 
    app.use(bodyParser.urlencoded({ extended: true }));

    // Sets our static/public directory
    const publicDir = path.join(__dirname, 'public');
    app.use(express.static(publicDir)); 

    // Configures views/templates    
    const viewsDir = path.join(__dirname , 'app', 'views');
    app.set('view engine', 'ejs');
    app.set('views', viewsDir);      
    
    // Convenient conversions from ms to other times units
    var conversions = {
        'MILLISECONDS': 1,
        'SECONDS':      1000,
        'MINUTES':      60*1000,
        'HOURS':        60*60*1000,
        'DAYS':         24*60*60*1000
    };

    // Get session configuration info
    let sessionExpires = mbee.config.auth.session.expires;
    let sessionUnits = conversions[mbee.config.auth.session.units];

    // Configure sessions
    app.use(session({ 
        name: 'SESSION_ID',
        secret: mbee.config.server.secret, 
        resave: false,
        saveUninitialized: false,
        cookie: { 
            maxAge: sessionExpires * sessionUnits
        },
        store: new MongoStore({ mongooseConnection: mongoose.connection })
    }));

    // Load the API Routes
    if (state.api) {
        const APIRoutesPath = path.join(__dirname, 'app', 'api_routes.js');
        const APIRouter = require(APIRoutesPath);
        app.use('/api', APIRouter);         
    }
    // Load the plugin routes
    if (state.plugins) {
        const PluginRoutesPath = path.join(__dirname, 'plugins', 'routes.js');
        const PluginRouter = require(PluginRoutesPath);
        app.use('/ext', PluginRouter);      
    }
    // Load the UI/other routes
    if (state.ui) {
        const RoutesPath = path.join(__dirname, 'app', 'routes.js');
        const Router = require(RoutesPath);
        app.use('/', Router);               
    }

    /**************************************
     *  Server                            *          
     **************************************/

    mbee.lib.startup();

    // Read TLS/SSL certs
    if (mbee.config.server.ssl) {
        var keyPath = path.join('..', 'certs', `${mbee.config.server.ssl_cert_name}.key`);
        var crtPath = path.join('..', 'certs', `${mbee.config.server.ssl_cert_name}.crt`);
        var privateKey  = fs.readFileSync(path.join(__dirname, keyPath), 'utf8');
        var certificate = fs.readFileSync(path.join(__dirname, crtPath), 'utf8');
        var credentials = {key: privateKey, cert: certificate};
    }

    // Run HTTPSserver
    var httpServer = http.createServer(app);
    httpServer.listen(mbee.config.server.http_port, function() {
        mbee.log.info('MBEE server listening on port ' + mbee.config.server.http_port + '!')
    });

    // Run HTTPS Server
    if (mbee.config.server.ssl) {
        var httpsServer = https.createServer(credentials, app);
        httpsServer.listen(mbee.config.server.https_port, function() {
            mbee.log.info('MBEE server listening on port ' + mbee.config.server.https_port + '!')
        });
    }
    
}




/**
 * "start": "yarn install && yarn run build && yarn run server",
 */
function startCommand(args) {
    console.log(args)    
    installCommand()
    buildCommand()
}


/**
 * "test": "./node_modules/.bin/mocha test/_orchestrator.js --slow 19"
 */
function testCommand(args) {
    console.log(args)
}



