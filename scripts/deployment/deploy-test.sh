#!/bin/bash

ProjectDirectory=$1
Version=$2

# Create test namespace
echo '### Creating the test namespace if it does not exist ###'
kubectl create namespace test

# Create secret for accessing gitlab docker registry
echo '### Creating the secret to access gitlab docker registry if it does not exist ###'
kubectl create secret docker-registry mcf-repo --namespace=test --docker-server=registry.gitlab.us.lmco.com:443 --docker-username=gitlab+deploy-token-832 --docker-password=dockerpassword

# Removing old mcf deployment pod. Scales replicas to 0
echo '### Scaling the deployment to 0 ###' 
kubectl scale --replicas=0 deployment mcf-deployment -n test

# Removing old mongo deployment pod. Scales replicas to 0
echo '### Scaling the mongo deployment to 0 ###'
kubectl scale --replicas=0 deployment mongo-test-deployment -n test

# Create the mcf deployment
echo '### Creating the mcf deployment if it does not exists ###'
kubectl create -f $ProjectDirectory/kubernetes/mcf/mcf-test-deployment.yaml -n test

# Create the mongo deployment
echo '### Creating the mongo deployment if it does not exists ###'
kubectl create -f $ProjectDirectory/kubernetes/mongo/mongo-test-deployment.yaml -n test

# Updating the replicas to 1.
echo '### Updating the replicas to 1 ###'
kubectl scale --replicas=1 deployment mongo-deployment -n test

exit 0
