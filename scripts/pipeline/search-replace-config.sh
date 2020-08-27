#!/bin/bash

CI_PROJECT_DIR=$1
DEFAULT_ADMIN_USERNAME=$2
DEFAULT_ADMIN_PASSWORD=$3
LDAP_URL=$4
LDAP_BIND_DN=$5
LDAP_BIND_DN_PASS=$6
DB_URL=$7
DB_USERNAME=$8
DB_PASSWORD=$9

### Replace default admin username and password in production.cfg with gitlab protected variable value
sed -i "s|\"defaultAdminUsername\": \"\",/\"defaultAdminUsername\": \"$DEFAULT_ADMIN_USERNAME\",|" $CI_PROJECT_DIR/config/production.cfg
sed -i "s|\"defaultAdminPassword\": \"\",/\"defaultAdminPassword\": \"$DEFAULT_ADMIN_PASSWORD\",|" $CI_PROJECT_DIR/config/production.cfg

### Replace default admin username and password in pipeline.cfg with gitlab protected variable value
sed -i "s|\"defaultAdminUsername\": \"\",/\"defaultAdminUsername\": \"$DEFAULT_ADMIN_USERNAME\",|" $CI_PROJECT_DIR/config/pipeline.cfg
sed -i "s|\"defaultAdminPassword\": \"\",/\"defaultAdminPassword\": \"$DEFAULT_ADMIN_PASSWORD\",|" $CI_PROJECT_DIR/config/pipeline.cfg

### Replace the ldap url, ldap_bind_dn, and ldap_bind_pass in production.cfg with gitlab protected variable value
sed -i "s|\"url\": \"ldap_url\",/\"url\": \"$LDAP_URL\",|" $CI_PROJECT_DIR/config/production.cfg
sed -i "s|\"bind_dn\": \"ldap_bind_dn\",/\"bind_dn\": \"$LDAP_BIND_DN\",|" $CI_PROJECT_DIR/config/production.cfg
sed -i "s|\"bind_dn_pass\": \"ldap_bind_dn_pass\",/\"bind_dn_pass\": \"$LDAP_BIND_DN_PASS\",|" $CI_PROJECT_DIR/config/production.cfg

### Replace the database url, username, and password in production.cfg with gitlab protected variable value
sed -i "s|\"url\": \"db_url\",/\"url\": \"$DB_URL\",|" $CI_PROJECT_DIR/config/production.cfg
sed -i "s|\"username\": \"db_username\",/\"username\": $DB_USERNAME,|" $CI_PROJECT_DIR/config/production.cfg
sed -i "s|\"password\": \"db_password\",/\"password\": $DB_PASSWORD,|" $CI_PROJECT_DIR/config/production.cfg

### Replace the database url, username, and password in pipeline.cfg with gitlab protected variable value
sed -i "s|\"url\": \"db_url\",/\"url\": \"$DB_URL\",|" $CI_PROJECT_DIR/config/pipeline.cfg
sed -i "s|\"username\": \"db_username\",/\"username\": $DB_USERNAME,|" $CI_PROJECT_DIR/config/pipeline.cfg
sed -i "s|\"password\": \"db_password\",/\"password\": $DB_PASSWORD,|" $CI_PROJECT_DIR/config/pipeline.cfg