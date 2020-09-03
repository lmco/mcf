#!/bin/bash

# This script searches and replaces all sensitive data with gitlab protected variables

CI_PROJECT_DIR=$1
NFS_SHARE_URL=$2
DOCKER_PASSWORD=$3

### Replace nfs_share_address in dev and prod persistant volume config with gitlab protected variable value
sed -i "s/server: nfs_share_address/server: $NFS_SHARE_URL/" $CI_PROJECT_DIR/kubernetes/mongo/mongo-dev-pv.yaml
sed -i "s/server: nfs_share_address/server: $NFS_SHARE_URL/" $CI_PROJECT_DIR/kubernetes/mongo/mongo-prod-pv.yaml

### Replace docker password in all deploy scripts with gitlab protected variable value
sed -i "s/--docker-password=dockerpassword/--docker-password=$DOCKER_PASSWORD/" $CI_PROJECT_DIR/scripts/deployment/deploy-dev.sh
sed -i "s/--docker-password=dockerpassword/--docker-password=$DOCKER_PASSWORD/" $CI_PROJECT_DIR/scripts/deployment/deploy-prod.sh
sed -i "s/--docker-password=dockerpassword/--docker-password=$DOCKER_PASSWORD/" $CI_PROJECT_DIR/scripts/deployment/deploy-test.sh
