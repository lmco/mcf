#!/bin/bash

CI_PROJECT_DIR=$1
LMCertAuthority=$2

mkdir $CI_PROJECT_DIR/certs
echo $LMCertAuthority > $CI_PROJECT_DIR/certs/LockheedMartinCertificateAuthority.pem
