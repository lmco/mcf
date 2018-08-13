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
                sh 'yarn install'
                sh 'MBEE_ENV=test node mbee build'

                // Verify build
                sh 'ls -l'

                // Build the docker image
                sh 'MBEE_ENV=test node mbee docker --build'
            }
        }

        /**
         * Runs the staging docker container from the production image
         */
        stage('Deploy') {
            steps {
                // Removes any existing running or stopped stage containers.
                sh 'MBEE_ENV=test node mbee docker --clean'
                /* Runs the container in the background. */
                sh 'MBEE_ENV=test node mbee docker --run'
            }
        }

        stage('Test') {
            steps {
                // Runs the basic test suite against the running stage container
                sh 'MBEE_ENV=test node mbee lint'
                // Wait to be sure server is up
                sh 'sleep 30'

                // Runs the basic test suite against the running stage container
                // The bail command will stop running tests after one test fails
                timeout(time: 10, unit: 'MINUTES') {
                    // creating a junit xml file
                    sh "echo 'running test'"
                    sh 'MBEE_ENV=test node mbee test --bail true --reporter mocha-junit-reporter --grep "^[0-6]"'
                }
             }
        }
    }

    /**
     * This gets run at the end of the pipeline.
     * The list of defined email-ext env variables can be found at
     * https://wiki.jenkins.io/display/JENKINS/Building+a+software+project#Buildingasoftwareproject-below
     * The list of defined gitLab variable can be found at
     * https://github.com/jenkinsci/gitlab-plugin
     */
    post {
        always {
            // Things to always do post-build
            sh 'echo "Build and Deploy Complete"'

            // Gets the logs and prints them to the console
            //sh 'MBEE_ENV=test node mbee docker --get-logs'
            // Removes any test containers
            sh 'MBEE_ENV=test node mbee docker --clean'

            junit 'test-results.xml'
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
                    echo 'master branch'
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
                    echo 'no merge request title'
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
                    echo 'normal'
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
        *This will run only when a request is unstable
        */
        unstable{
            script {
                echo 'unstable'

                // if merge request from the master branch the source branch and target branch
                // will return as null characters
                // checking for null characters so email does not show null
                if (env.gitlabSourceBranch == null){
                    emailext body: "${env.JOB_NAME} - Build #${env.BUILD_NUMBER} UNSTABLE:\
                        <br/><br/>\
                        Merge Request: No Merge Request Title<br/> \
                        Source Branch: master<br/> \
                        Target Branch: master<br/> \
                        User: ${env.gitlabUserEmail}\
                        <br/><br/>View the Git commit on <a \
                        href=\"https://gitlab.lmms.lmco.com/mbee/mbee/commit/${env.GIT_COMMIT}\">\
                        GitLab</a>.",
                        mimeType: 'text/html',
                        subject: "[jenkins] ${env.JOB_NAME} - Build #${env.BUILD_NUMBER} - UNSTABLE",
                        to: "mbee-developers.dl-ssc@exch.ems.lmco.com",
                        replyTo: "mbee-service.fc-ssc@lmco.com",
                        from: "mbee-service.fc-ssc@lmco.com"
                }
                // if merge request title is not there, it will return null
                // this will make sure the merge request title is never null
                else if (env.gitlabMergeRequestTitle == null) {
                    emailext body: "${env.JOB_NAME} - Build #${env.BUILD_NUMBER} - UNSTABLE: \
                        <br/><br/>\
                        Merge Request: ${env.gitlabMergeRequestTitle}<br/> \
                        Source Branch: ${env.gitlabSourceBranch}<br/> \
                        Target Branch: ${env.gitlabTargetBranch}<br/> \
                        User: ${env.gitlabUserEmail}\
                        <br/><br/>View the Git commit on <a \
                        href=\"https://gitlab.lmms.lmco.com/mbee/mbee/commit/${env.GIT_COMMIT}\">\
                        GitLab</a>.",
                        mimeType: 'text/html',
                        subject: "[jenkins] ${env.JOB_NAME} - Build #${env.BUILD_NUMBER} - UNSTABLE",
                        to: "mbee-developers.dl-ssc@exch.ems.lmco.com",
                        replyTo: "mbee-service.fc-ssc@lmco.com",
                        from: "mbee-service.fc-ssc@lmco.com",
                        attachLog: true
                }
                else {
                    emailext body: "${env.JOB_NAME} - Build #${env.BUILD_NUMBER} - UNSTABLE: \
                        <br/><br/>\
                        Merge Request: ${env.gitlabMergeRequestTitle}<br/> \
                        Source Branch: ${env.gitlabSourceBranch}<br/> \
                        Target Branch: ${env.gitlabTargetBranch}<br/> \
                        User: ${env.gitlabUserEmail}\
                        <br/><br/>View the Git commit on <a \
                        href=\"https://gitlab.lmms.lmco.com/mbee/mbee/commit/${env.GIT_COMMIT}\">\
                        GitLab</a>.",
                        mimeType: 'text/html',
                        subject: "[jenkins] ${env.JOB_NAME} - Build #${env.BUILD_NUMBER} - UNSTABLE",
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

