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

/* eslint-disable no-console */

// Load node modules
const { spawn, spawnSync } = require('child_process');

// If the application is run directly from node, notify the user and fail
if (module.parent == null) {
  // eslint-disable-next-line no-console
  console.log('\nError: please use mbee to run this script by using the '
    + 'following command. \n\nnode mbee docker\n');
  process.exit(-1);
}

module.exports = docker;

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
    cmd = spawnSync('docker', ['stop', M.config.docker.container.name], { stdio: 'inherit' });
    console.log('stdout:', cmd.stdout); // eslint-disable-line no-console
    console.log('stderr:', cmd.stderr); // eslint-disable-line no-console
    console.log('Docker container stopped'); // eslint-disable-line no-console

    // Remove the container
    cmd = spawnSync('docker', ['rm', M.config.docker.container.name], { stdio: 'inherit' });
    console.log('stdout:', cmd.stdout); // eslint-disable-line no-console
    console.log('stderr:', cmd.stderr); // eslint-disable-line no-console
    console.log('Docker container removed'); // eslint-disable-line no-console
  }

  // Build the Docker image
  else if (args.includes('--build')) {
    console.info('Building Docker Image ...');

    // Build docker by running: "docker build -f .../Dockerfile -t mbee ."
    const buildArgs = [                                               // Create the build args
      'build',
      '-f', M.config.docker.Dockerfile,
      '-t', M.config.docker.image.name, '.'
    ];
    const cmd = spawn('docker', buildArgs, { stdio: 'inherit' });     // Run the build process
    cmd.on('data', (data) => {
      console.log(data.toString());
    });
    cmd.on('exit', (code) => {
      if (code !== 0) {                                                // Fail if exit code != 0
        console.log('Docker build failed'); // eslint-disable-line no-console
        process.exit(code);
      }
      else {                                                          // Log successful build
        console.log('Docker Image Built.');
      }
    });
  }

  // Run the Docker container
  else if (args.includes('--run')) {
    console.log('Running Docker Container ...');

    // Build the "docker run" command
    let rargs = [
      'run',
      '-d',
      '-it',
      '--restart=always',
      '-e', `MBEE_ENV=${M.env}`
    ];
    if (M.config.server.http.enabled && M.config.docker.http.enabled) {
      rargs = rargs.concat(['-p', `${M.config.docker.http.port}:${M.config.server.http.port}`]);
    }
    if (M.config.server.https.enabled && M.config.docker.https.enabled) {
      rargs = rargs.concat(['-p', `${M.config.docker.https.port}:${M.config.server.https.port}`]);
    }
    rargs = rargs.concat(['--name', M.config.docker.container.name]);
    rargs = rargs.concat([M.config.docker.image.name]);
    console.log(rargs);

    // Run the Docker container
    const cmd = spawn('docker', rargs, { stdio: 'inherit' });
    cmd.on('data', (data) => { console.log(data.toString()); });
    cmd.on('exit', (code) => {
      if (code !== 0) {
        console.log('Docker run failed');
        process.exit(code);
      }
    });
    console.log('Docker Container Running in Background.');
  }

  // Get the Docker logs
  else if (args.includes('--get-logs')) {
    console.log('Getting docker logs ...');

    // Build the "docker run" command
    const rargs = [
      'logs',
      M.config.docker.container.name
    ];

    // Call the Docker logs command
    const cmd = spawn('docker', rargs, { stdio: 'inherit' });
    cmd.on('data', (data) => { console.log(data.toString()); });
    cmd.on('exit', (code) => {
      if (code !== 0) {
        console.log('Docker logs failed');
        process.exit(code);
      }
    });
    console.log('End of Docker logs.');
  }
  else {
    console.log('Invalid arguments');
  }
}
