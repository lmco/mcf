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
            }
        }

        /**
         * Builds the production docker image based on the Dockerfile.
         */
        stage('Build') {
            steps {
                // Build
                sh 'NODE_ENV=production node mbee build'
                sh "sed -i 's/NO_BUILD_NUMBER/$BUILD_NUMBER/g' package.json"

                // Verify build
                sh 'ls -l'

                // Build the docker image
                sh 'NODE_ENV=production node mbee docker --build'
            }
        }

        /**
         * First, stops and removes current container.
         * Then runs the newly built docker container.
         */
        stage('Run') {
            steps {
                // Removes any existing production running containers
                sh 'NODE_ENV=production node mbee docker --clean'

                // Runs the production container in the background
                sh 'NODE_ENV=production node mbee docker --run'
            }
        }

    }

    /**
     * This gets run at the end of the pipeline.
     */
    post {
        always {
            // Always ensure production container is removed
            sh 'NODE_ENV=production node mbee docker --clean'
        }
        success {
            emailext body: "${env.JOB_NAME} - Build #${env.BUILD_NUMBER} SUCCEEDED:\
                <br/><br/>No further action is required.",
                mimeType: 'text/html',
                subject: "[jenkins] ${env.JOB_NAME} - Build #${env.BUILD_NUMBER} - SUCCESS!",
                to: "mbee-developers.dl-ssc@exch.ems.lmco.com",
                replyTo: "mbee-service.fc-ssc@lmco.com",
                from: "mbee-service.fc-ssc@lmco.com"
        }
        failure {
            emailext body: "${env.JOB_NAME} - Build #${env.BUILD_NUMBER} - FAILED: \
                <br/><br/>Check console output at ${env.BUILD_URL} to view the results.\
                <br/><br/>View the Git commit on <a \
                href=\"https://gitlab.lmms.lmco.com/mbee/mbee/commit/${env.GIT_COMMIT}\">\
                GitLab</a>.",
                mimeType: 'text/html',
                subject: "[jenkins] ${env.JOB_NAME} - Build #${env.BUILD_NUMBER} - FAILURE!",
                to: "mbee-developers.dl-ssc@exch.ems.lmco.com",
                replyTo: "mbee-service.fc-ssc@lmco.com",
                from: "mbee-service.fc-ssc@lmco.com",
                attachLog: true
        }
    }
}

