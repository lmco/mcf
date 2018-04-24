/******************************************************************************
 * Classification: UNCLASSIFIED                                               *
 *                                                                            *
 * Copyright (C) 2018, Lockheed Martin Corporation                            *
 *                                                                            *
 * LMPI WARNING: This file is Lockheed Martin Proprietary Information.        *
 * It is not approved for public release or redistribution.                   *
 *                                                                            *
 * EXPORT CONTROL WARNING: This software may be subject to applicable export  *
 * control laws. Contact legal and export compliance prior to distribution.   *
 ******************************************************************************/
/**
 * Jenkinsfile
 *
 * Josh Kaplan
 * joshua.d.kaplan@lmco.com
 *
 * This file defines the build pipeline for Jenkins.
 */

pipeline {
    agent any

    environment {
        HTTP_PROXY = "http://proxy-lmi.global.lmco.com:80"
        HTTPS_PROXY = "http://proxy-lmi.global.lmco.com:80"
        http_proxy = "http://proxy-lmi.global.lmco.com:80"
        https_proxy = "http://proxy-lmi.global.lmco.com:80"
        NO_PROXY = 127.0.0.1,localhost,*.lmco.com
        NODE_ENV = production
        NODE_TLS_REJECT_UNAUTHORIZED = 0
    }

    stages {

        /**
         * Runs a few sanity-check and cleanup commands.
         */
        stage('Prepare') {
            steps {
                sh 'echo $HTTP_PROXY'

                // Yarn config
                sh 'yarn config set "http-proxy" $HTTP_PROXY'
                sh 'yarn config set "https-proxy" $HTTPS_PROXY'
                sh 'yarn config set "strict-ssl" false'
                sh 'yarn config set "cafile" ./certs/LockheedMartinRootCertificationAuthority.pem'

                // Clean build env
                sh 'yarn clean:all'

                sh 'echo $HTTP_PROXY'
            }
        }

        /**
         * Builds the docker image based on the Dockerfile.
         */
        stage('Build') {
            steps {
                sh 'echo $HTTP_PROXY'
                sh 'yarn install'
                sh 'yarn build' 
            }
        }

        /**
         * First, stops and removes current container.
         * Then runs the newly built docker container.
         */
        stage('Run') {
            steps {
                /* 
                 * Removes any existing running containers. 
                 * This <command> || $(exit 0) approach is required so Jenkins
                 * doesn't fail is the stop/remove commands fail when container
                 * isn't currently running.
                 */
                sh '$(yarn docker:clean) || $(exit 0);' 

                /* Runs the container in the background. */
                sh 'yarn docker:run'
                sh 'echo "Running new container"'
            }
        }

    }
}

