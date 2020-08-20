#!/bin/bash

# This script searches and replaces all sensitive data with gitlab protected variables

NFS_SHARE_URL=$1
DOCKER_PASSWORD=$2

### Replace nfs_share_address in dev and prod persistant volume config with gitlab protected variable value
sed -i "s/server: nfs_share_address/server: $NFS_SHARE_URL/" ../../kubernetes/mcf/mcf-dev-pv.yaml
sed -i "s/server: nfs_share_address/server: $NFS_SHARE_URL/" ../../kubernetes/mcf/mcf-prod-pv.yaml

### Replace docker password in all deploy scripts with gitlab protected variable value
sed -i "s/--docker-password=dockerpassword/--docker-password=$DOCKER_PASSWORD/" ../deployment/deploy-dev.sh
sed -i "s/--docker-password=dockerpassword/--docker-password=$DOCKER_PASSWORD/" ../deployment/deploy-prod.sh
sed -i "s/--docker-password=dockerpassword/--docker-password=$DOCKER_PASSWORD/" ../deployment/deploy-test.sh

cat ../../kubernetes/mcf/mcf-dev-pv.yaml
cat ../../kubernetes/mcf/mcf-prod-pv.yaml
cat ../deployment/deploy-dev.sh
cat ../deployment/deploy-prod.sh
cat ../deployment/deploy-test.sh
