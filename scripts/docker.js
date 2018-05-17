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
/**
 * scripts/docker.js
 *
 * @author  Josh Kaplan <joshua.d.kaplan@lmco.com>
 *
 * This script defines the Docker build and run process. Most of the
 * process is parameterized by the configuration.
 */

const { execSync, spawn, spawnSync } = require('child_process');

const M = require(__dirname + '/../mbee.js');
const build = require(`${M.root}/scripts/build`).build;

if (module.parent == null) {
  docker(process.argv.slice(2))
}
else {
  module.exports = docker;
}


/**
 * The Docker command can be used to build a Docker image or run a Docker
 * container. It supports the command line arguments `--clean`, `--build`, and
 * `--run` to clean the previous docker container, build the Docker image, or
 * run the container, respectively. All of these options expect configuration
 * parameters to be defined in the Docker section of the config.json file.
 * The commands are not mutually exclusive, if run together the previous Docker
 * container is stopped and removed, the image is built and then the container
 * is run.
 */

function docker(args) {
    // Removes the previous docker build.
    if (args.includes('--clean')) {
      let cmd = null;

      // Stop the running container
      cmd = spawnSync('docker', ['stop', M.config.docker.container.name], {stdio: 'inherit'});
      console.log('stdout:', cmd.stdout);
      console.log('stderr:', cmd.stderr);
      console.log('Docker container stopped');

      // Remove the container
      cmd = spawnSync('docker', ['rm', M.config.docker.container.name], {stdio: 'inherit'});
      console.log('stdout:', cmd.stdout);
      console.log('stderr:', cmd.stderr);
      console.log('Docker container removed');

    }

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
        cmd.on('data', function (data) {
            console.log(data.toString());           // Print stdout
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
        let server = M.config.server;
        let docker = M.config.docker;
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
            rargs = rargs.concat(['-p', `${docker.https.port}:${server.https.port}`]);
        }
        rargs = rargs.concat(['--name', M.config.docker.container.name])
        rargs = rargs.concat([M.config.docker.image.name])
        console.log(rargs)

        // Run the Docker container
        let cmd = spawn('docker', rargs, {stdio: 'inherit'});
        cmd.on('data', (data) => { console.log(data.toString()); });
        cmd.on('exit', function (code) {
            if (code != 0) {
                console.log('Docker run failed');
                process.exit(code);
            }
        });
        console.log('Docker Container Running in Background.');
    }
}
