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
 * Leah De Laurell
 * leah.p.delaurell@lmco.com
 *
 * This file defines a new pipeline in developement.
 */

pipeline {
    agent any
    options {
        timeout(time: 20, unit: 'MINUTES')
    }
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
            stages {
                stage('Build MBEE'){
                    steps {
                        // Build
                        sh 'NODE_ENV=stage node mbee build'

                        sh "sed -i 's/NO_BUILD_NUMBER/$BUILD_NUMBER/g' package.json"

                        // Verify build
                        sh 'ls -l'
                    }
                }
                stage('Build Docker MBEE'){
                    steps {
                        sh "echo 'building'"
                        sh 'NODE_ENV=stage node mbee docker --build '
                        sh ''
                    }
                }
            }
        }
        /**
         * First, stops and removes current container.
         * Then runs the newly built docker container.
         */
        stage('Run') {
            steps {
                // Removes any existing production running containers
                sh 'NODE_ENV=stage node mbee docker --clean'

                // Runs the production container in the background
                sh "echo 'run'"
                sh 'NODE_ENV=stage node mbee docker --run -v /config:/lm/mbee/config'
            }
        }

        /**
         * Executes functional tests against the staged server.
         */
        //stage('Wait for Server') {
        //    steps {
        //        // Wait to be sure server is up
        //        sh 'sleep 30'
        //    }
        //}

        //stage('Run tests') {
        //    steps {
        //        // Runs the basic test suite against the running stage container
        //        // The bail command will stop running tests after one test fails
        //        timeout(time: 10, unit: 'MINUTES') {
        //            // creating a junit xml file.... pls work
        //            sh 'NODE_ENV=stage node mbee test --reporter=mocha-junit-reporter --grep "^[0-4]"'
        //        }
        //    }
        //}
    }

    /**
     * This gets run at the end of the pipeline.
     */
    post {

       /**
        *This will always run after the pipeline is finished
        */
        always {
            //junit 'test-results.xml'
            // Gets the logs and prints them to the console
            //sh 'NODE_ENV=stage node mbee docker --get-logs'
            // Removes any test containers
            sh 'NODE_ENV=stage node mbee docker --clean'
        }

       /**
        *This will run only when a request succeeds
        */
        success {
            script {
                echo 'success'

                // if merge request from the master branch the source branch and target branch
                // will return as null characters
                // checking for null characters so email does not show null
                if (env.gitlabSourceBranch == null){
                    emailext body: "${env.JOB_NAME} - Build #${env.BUILD_NUMBER} SUCCEEDED:\
                        <br/><br/>\
                        Merge Request: No Merge Request Title<br/> \
                        Source Branch: master<br/> \
                        Target Branch: master<br/> \
                        <br/><br/>\
                        Merge request passed automated tests. No further action is required.",
                        mimeType: 'text/html',
                        subject: "[jenkins] ${env.JOB_NAME} - Build #${env.BUILD_NUMBER} - SUCCESS",
                        to: "mbee-developers.dl-ssc@exch.ems.lmco.com",
                        replyTo: "mbee-service.fc-ssc@lmco.com",
                        from: "mbee-service.fc-ssc@lmco.com"
                }
                // if merge request title is not there, it will return null
                // this will make sure the merge request title is never null
                else if (env.gitlabMergeRequestTitle == null){
                    emailext body: "${env.JOB_NAME} - Build #${env.BUILD_NUMBER} SUCCEEDED:\
                        <br/><br/>\
                        Merge Request: No Merge Request Title<br/> \
                        Source Branch: ${env.gitlabSourceBranch}<br/> \
                        Target Branch: ${env.gitlabTargetBranch}<br/> \
                        <br/><br/>\
                        Merge request passed automated tests. No further action is required.",
                        mimeType: 'text/html',
                        subject: "[jenkins] ${env.JOB_NAME} - Build #${env.BUILD_NUMBER} - SUCCESS",
                        to: "mbee-developers.dl-ssc@exch.ems.lmco.com",
                        replyTo: "mbee-service.fc-ssc@lmco.com",
                        from: "mbee-service.fc-ssc@lmco.com"
                }
                else {
                    emailext body: "${env.JOB_NAME} - Build #${env.BUILD_NUMBER} SUCCEEDED:\
                        <br/><br/>\
                        Merge Request: ${env.gitlabMergeRequestTitle}<br/> \
                        Source Branch: ${env.gitlabSourceBranch}<br/> \
                        Target Branch: ${env.gitlabTargetBranch}<br/> \
                        <br/><br/>\
                        Merge request passed automated tests. No further action is required.",
                        mimeType: 'text/html',
                        subject: "[jenkins] ${env.JOB_NAME} - Build #${env.BUILD_NUMBER} - SUCCESS",
                        to: "mbee-developers.dl-ssc@exch.ems.lmco.com",
                        replyTo: "mbee-service.fc-ssc@lmco.com",
                        from: "mbee-service.fc-ssc@lmco.com"
                }
            }
          }

        /**
         *This will run only when a request fails
         */
        failure {
            script {
                echo 'failed'

                // if merge request from the master branch the source branch and target branch
                // will return as null characters
                // checking for null characters so email does not show null
                if (env.gitlabSourceBranch == null){
                    emailext body: "${env.JOB_NAME} - Build #${env.BUILD_NUMBER} FAILED:\
                        <br/><br/>\
                        Merge Request: No Merge Request Title<br/> \
                        Source Branch: master<br/> \
                        Target Branch: master<br/> \
                        User: ${env.gitlabUserEmail}\
                        <br/><br/>\
                        Merge request of ${env.gitlabSourceBranch} failed. Check console output at \
                        ${env.BUILD_URL} or see the attached build log to view the results.\
                        <br/><br/>\
                        View the source branch on <a href=\"${env.gitlabSourceRepoHttpUrl}\">GitLab</a>.",
                        mimeType: 'text/html',
                        subject: "[jenkins] ${env.JOB_NAME} - Build #${env.BUILD_NUMBER} - FAILURE",
                        to: "mbee-developers.dl-ssc@exch.ems.lmco.com",
                        replyTo: "mbee-service.fc-ssc@lmco.com",
                        from: "mbee-service.fc-ssc@lmco.com"
                }
                // if merge request title is not there, it will return null
                // this will make sure the merge request title is never null
                else if (env.gitlabMergeRequestTitle == null) {
                    emailext body: "${env.JOB_NAME} - Build #${env.BUILD_NUMBER} FAILED: \
                        <br/><br/>\
                        Merge Request: No Merge Request Title<br/> \
                        Source Branch: ${env.gitlabSourceBranch}<br/> \
                        Target Branch: ${env.gitlabTargetBranch}<br/> \
                        User: ${env.gitlabUserEmail}\
                        <br/><br/>\
                        Merge request of ${env.gitlabSourceBranch} failed. Check console output at \
                        ${env.BUILD_URL} or see the attached build log to view the results.\
                        <br/><br/>\
                        View the source branch on <a href=\"${env.gitlabSourceRepoHttpUrl}\">GitLab</a>.",
                        mimeType: 'text/html',
                        subject: "[jenkins] ${env.JOB_NAME} - Build #${env.BUILD_NUMBER} - FAILURE",
                        to: "mbee-developers.dl-ssc@exch.ems.lmco.com",
                        replyTo: "mbee-service.fc-ssc@lmco.com",
                        from: "mbee-service.fc-ssc@lmco.com",
                        attachLog: true
                }
                else {
                    emailext body: "${env.JOB_NAME} - Build #${env.BUILD_NUMBER} FAILED: \
                        <br/><br/>\
                        Merge Request: ${env.gitlabMergeRequestTitle}<br/> \
                        Source Branch: ${env.gitlabSourceBranch}<br/> \
                        Target Branch: ${env.gitlabTargetBranch}<br/> \
                        User: ${env.gitlabUserEmail}\
                        <br/><br/>\
                        Merge request of ${env.gitlabSourceBranch} failed. Check console output at \
                        ${env.BUILD_URL} or see the attached build log to view the results.\
                        <br/><br/>\
                        View the source branch on <a href=\"${env.gitlabSourceRepoHttpUrl}\">GitLab</a>.",
                        mimeType: 'text/html',
                        subject: "[jenkins] ${env.JOB_NAME} - Build #${env.BUILD_NUMBER} - FAILURE",
                        to: "mbee-developers.dl-ssc@exch.ems.lmco.com",
                        replyTo: "mbee-service.fc-ssc@lmco.com",
                        from: "mbee-service.fc-ssc@lmco.com",
                        attachLog: true
                }
            }
        }

       /**
        *This will run only when a request was aborted
        */
        aborted{
            script {
                echo 'aborted'

                // if merge request from the master branch the source branch and target branch
                // will return as null characters
                // checking for null characters so email does not show null
                if (env.gitlabSourceBranch == null){
                    emailext body: "${env.JOB_NAME} - Build #${env.BUILD_NUMBER} ABORTED: \
                        <br/><br/>\
                        Merge Request: No Merge Request Title<br/> \
                        Source Branch: master<br/> \
                        Target Branch: master<br/> \
                        User: ${env.gitlabUserEmail}\
                        <br/><br/>\
                        Merge request of ${env.gitlabSourceBranch} was aborted. Check console output at \
                        ${env.BUILD_URL} or see the attached build log to view the results.\
                        <br/><br/>\
                        View the source branch on <a href=\"${env.gitlabSourceRepoHttpUrl}\">GitLab</a>.",
                        mimeType: 'text/html',
                        subject: "[jenkins] ${env.JOB_NAME} - Build #${env.BUILD_NUMBER} - ABORTED",
                        to: "mbee-developers.dl-ssc@exch.ems.lmco.com",
                        replyTo: "mbee-service.fc-ssc@lmco.com",
                        from: "mbee-service.fc-ssc@lmco.com",
                        attachLog: true
                }
                // if merge request title is not there, it will return null
                // this will make sure the merge request title is never null
                else if (env.gitlabMergeRequestTitle == null) {
                    emailext body: "${env.JOB_NAME} - Build #${env.BUILD_NUMBER} ABORTED: \
                         <br/><br/>\
                         Merge Request: No Merge Request Title<br/> \
                         Source Branch: ${env.gitlabSourceBranch}<br/> \
                         Target Branch: ${env.gitlabTargetBranch}<br/> \
                         User: ${env.gitlabUserEmail}\
                         <br/><br/>\
                         Merge request of ${env.gitlabSourceBranch} was aborted. Check console output at \
                         ${env.BUILD_URL} or see the attached build log to view the results.\
                         <br/><br/>\
                         View the source branch on <a href=\"${env.gitlabSourceRepoHttpUrl}\">GitLab</a>.",
                         mimeType: 'text/html',
                         subject: "[jenkins] ${env.JOB_NAME} - Build #${env.BUILD_NUMBER} - ABORTED",
                         to: "mbee-developers.dl-ssc@exch.ems.lmco.com",
                         replyTo: "mbee-service.fc-ssc@lmco.com",
                         from: "mbee-service.fc-ssc@lmco.com",
                         attachLog: true
                }
                else {
                    emailext body: "${env.JOB_NAME} - Build #${env.BUILD_NUMBER} ABORTED: \
                         <br/><br/>\
                         Merge Request: ${env.gitlabMergeRequestTitle}<br/> \
                         Source Branch: ${env.gitlabSourceBranch}<br/> \
                         Target Branch: ${env.gitlabTargetBranch}<br/> \
                         User: ${env.gitlabUserEmail}\
                         <br/><br/>\
                         Merge request of ${env.gitlabSourceBranch} was aborted. Check console output at \
                         ${env.BUILD_URL} or see the attached build log to view the results.\
                         <br/><br/>\
                         View the source branch on <a href=\"${env.gitlabSourceRepoHttpUrl}\">GitLab</a>.",
                         mimeType: 'text/html',
                         subject: "[jenkins] ${env.JOB_NAME} - Build #${env.BUILD_NUMBER} - ABORTED",
                         to: "mbee-developers.dl-ssc@exch.ems.lmco.com",
                         replyTo: "mbee-service.fc-ssc@lmco.com",
                         from: "mbee-service.fc-ssc@lmco.com",
                         attachLog: true
                }
            }
        }
    }
}
