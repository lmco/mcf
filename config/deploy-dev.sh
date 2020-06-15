#!/bin/bash

ProjectDirectory=$1
Version=$2

# Create dev namespace
echo 'Creating the dev namespace if it does not exist'
kubectl create namespace dev

# Create secret for accessing gitlab docker registry
echo 'Creating the secret to access gitlab docker registry'
kubectl create secret docker-registry mcf-repo --namespace=dev --docker-server=registry.gitlab.us.lmco.com:443 --docker-username=gitlab+deploy-token-832 --docker-password=q12LwJwfpNBzRyTYTcNj

# Create the mcf deployment
echo 'Creating the mcf deployment'
kubectl create -f $ProjectDirectory/kubernetes/mcf/mcf-deployment.yaml -n dev
