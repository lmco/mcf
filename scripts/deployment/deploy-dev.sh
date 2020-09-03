#!/bin/bash

ProjectDirectory=$1
Version=$2
NfsShareUrl=$3
DockerPassword=$4

# Finding and replacing values
sed -i "s/server: nfs_share_address/server: $NfsShareUrl/" $ProjectDirectory/kubernetes/mongo/mongo-dev-pv.yaml
sed -i "s/--docker-password=dockerpassword/--docker-password=$DockerPassword/" $ProjectDirectory/scripts/deployment/deploy-dev.sh

# Create dev namespace
echo '### Creating the dev namespace if it does not exist ###'
kubectl create namespace dev

# Create secret for accessing gitlab docker registry
echo '### Creating the secret to access gitlab docker registry if it does not exist ###'
kubectl create secret docker-registry mcf-repo --namespace=dev --docker-server=registry.gitlab.us.lmco.com:443 --docker-username=gitlab+deploy-token-832 --docker-password=dockerpassword

# Create persistent volume
echo '### Creating Persistent Volume ###'
kubectl create -f $ProjectDirectory/kubernetes/mongo/mongo-dev-pv.yaml -n dev

# Removing old mcf deployment pod. Scales replicas to 0
echo '### Scaling the deployment to 0 ###' 
kubectl scale --replicas=0 deployment mcf-deployment -n dev

# Removing old mongo deployment pod. Scales replicas to 0
echo '### Scaling the mongo deployment to 0 ###'
kubectl scale --replicas=0 deployment mongo-dev-deployment -n dev

# Create the mongo deployment
echo '### Creating the mongo deployment if it does not exists ###'
kubectl create -f $ProjectDirectory/kubernetes/mongo/mongo-dev-deployment.yaml -n dev

# Create the mcf deployment
echo '### Creating the mcf deployment if it does not exists ###'
kubectl create -f $ProjectDirectory/kubernetes/mcf/mcf-dev-deployment.yaml -n dev

# Updating the replicas to 1.
echo '### Updating the replicas to 1 ###'
kubectl scale --replicas=1 deployment mcf-deployment -n dev

exit 0

