#!/bin/bash

ProjectDirectory=$1
Version=$2

# Create prod namespace
echo 'Creating the prod namespace if it does not exist'
kubectl create namespace prod

# Create secret for accessing gitlab docker registry
echo 'Creating the secret to access gitlab docker registry if it does not exist'
kubectl create secret docker-registry mcf-repo --namespace=prod --docker-server=registry.gitlab.us.lmco.com:443 --docker-username=gitlab+deploy-token-832 --docker-password=q12LwJwfpNBzRyTYTcNj

# Removing old mcf deployment pod. Scales replicas to 0
echo 'Scaling the deployment to 0' 
kubectl scale --replicas=0 deployment mcf-deployment -n prod

# Create the mcf deployment
echo 'Creating the mcf deployment if it does not exists'
kubectl create -f $ProjectDirectory/kubernetes/mcf/mcf-prod-deployment.yaml -n prod

# Updating the replicas to 1.
echo 'Updating the replicas to 1'
kubectl scale --replicas=1 deployment mcf-deployment -n prod

exit 0
