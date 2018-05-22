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

    stages {
        /**
         * Runs a few sanity-check and cleanup commands.
         */
        stage('Prepare') {
            steps {
                // Clean build env
                sh 'rm -rf node_modules'
                sh 'rm -rf public'
                sh 'rm -rf logs/*'
                sh 'rm -rf *.log'
                sh 'git status'
            }
        }

        /**
         * Builds the production docker image based on the Dockerfile.
         */
        stage('Build') {
            steps {
                // Build
                sh 'NODE_ENV=test node mbee build'

                // Verify build
                sh 'ls -l'

                // Build the docker image
                sh 'NODE_ENV=test node mbee docker --build'
            }
        }

        /**
         * Runs the staging docker container from the production image
         */
        stage('Deploy') {
            steps {
                // Removes any existing running or stopped stage containers.
                sh 'NODE_ENV=test node mbee docker --clean'
                /* Runs the container in the background. */
                sh 'NODE_ENV=test node mbee docker --run'
            }
        }

        /**
         * Executes functional tests against the staged server.
         */
        stage('Test') {
            steps {
                // Wait to be sure server is up
                sh 'sleep 10'
                // Runs the basic test suite against the running stage container
                sh 'NODE_ENV=test node mbee test --grep "^[0-6]"'
            }
        }

    }

    /**
     * This gets run at the end of the pipeline.
     */
    post {
        always {
            // Removes any test containers
            sh 'NODE_ENV=test node mbee docker --clean'
        }

        success {
            //emailext body: "${env.JOB_NAME} ${env.GIT_BRANCH} - Build #${env.BUILD_NUMBER} SUCCEEDED:\
            //    <br/><br/>Merge request of branch ${env.GIT_BRANCH} passed automated tests. \
            //    No further action is required.",
            //    mimeType: 'text/html',
            //    subject: "[jenkins] ${env.JOB_NAME} ${env.GIT_BRANCH} SUCCESS",
            //    to: "mbee-developers.dl-ssc@exch.ems.lmco.com",
            //    replyTo: "mbee-service.fc-ssc@lmco.com",
            //    from: "mbee-service.fc-ssc@lmco.com"
        }
        failure {
            //emailext body: "${env.JOB_NAME} ${env.GIT_BRANCH} - Build #${env.BUILD_NUMBER} - FAILED: \
            //    <br/><br/>Check console output at ${env.BUILD_URL} to view the results.\
            //    <br/><br/>View the Git commit on <a \
            //    href=\"https://gitlab.lmms.lmco.com/mbee/mbee/commit/${env.GIT_COMMIT}\">\
            //    GitLab</a>.",
            //    mimeType: 'text/html',
            //    subject: "[jenkins] ${env.JOB_NAME} ${env.GIT_BRANCH} FAILURE",
            //    to: "mbee-developers.dl-ssc@exch.ems.lmco.com",
            //    replyTo: "mbee-service.fc-ssc@lmco.com",
            //    from: "mbee-service.fc-ssc@lmco.com",
            //    attachLog: true
        }
    }
}

