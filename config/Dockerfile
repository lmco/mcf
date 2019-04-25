##
# Classification: UNCLASSIFIED                                                                                                        #
#
# @module config.Dockerfile
#
# @copyright Copyright (C) 2018, Lockheed Martin Corporation
#
# @license LMPI - Lockheed Martin Proprietary Information
#
# @description This Dockerfile defines the Docker build for MBEE.
##
FROM node:6.17.1-stretch
MAINTAINER Lockheed Martin
WORKDIR /lm/mbee

# Set proxy environment variables
ENV HTTP_PROXY="http://proxy-lmi.global.lmco.com:80" \
    HTTPS_PROXY="http://proxy-lmi.global.lmco.com:80" \
    http_proxy="http://proxy-lmi.global.lmco.com:80" \
    https_proxy="http://proxy-lmi.global.lmco.com:80" \
    NO_PROXY=127.0.0.1,localhost

# Install certs - If you have certs in a certs directory, uncomment the following lines
RUN mkdir -p certs
COPY ./certs certs
RUN chmod 400 certs/*

# Prerequisites for MongoDB install
RUN apt-get install curl
RUN curl --cacert "./certs/LockheedMartinCertificateAuthority.pem"  https://www.mongodb.org/static/pgp/server-4.0.asc | apt-key add -
RUN echo "deb http://repo.mongodb.org/apt/debian stretch/mongodb-org/4.0 main" | tee /etc/apt/sources.list.d/mongodb-org-4.0.list

# Install dependencies
RUN apt-get -y upgrade \
 && apt-get -y update \
 && apt-get install -y git \
 && apt-get install -y openssh-client \
 && apt-get install -y --force-yes mongodb-org

# Configure Yarn
RUN yarn config set proxy http://proxy-lmi.global.lmco.com:80 \
    && yarn config set cafile "./certs/LockheedMartinCertificateAuthority.pem" \
    && yarn config set http-proxy "http://proxy-lmi.global.lmco.com" \
    && yarn config set https-proxy "http://proxy-lmi.global.lmco.com"

# Install modules using yarn from the package.json
COPY ./package.json package.json
RUN git config --global url."https://github.com".insteadOf "git://github.com"
RUN git config --global http.proxy "http://proxy-lmi.global.lmco.com:80"
RUN git config --global https.proxy "http://proxy-lmi.global.lmco.com:80"
RUN NOPOSTINSTALL=1 NOPREINSTALL=1 yarn install

# Create project directory structure
RUN mkdir logs \
    && mkdir -p config \
    && mkdir -p scripts \
    && mkdir -p plugins \
    && mkdir -p build \
    && mkdir -p public \
    && mkdir -p app \
    && mkdir -p /lm/mbee/data/db/log

# Copy Project
COPY ./config config
COPY ./scripts scripts
COPY ./mbee.js mbee.js
COPY ./plugins plugins
COPY ./build build
COPY ./app  app
COPY ./README.md README.md

# Make entrypoint.sh an executable
RUN chmod +x /lm/mbee/config/entrypoint.sh

# Define a volume
VOLUME data

# Expose ports
EXPOSE 6233
EXPOSE 6234
EXPOSE 27024

# Run server
ENTRYPOINT /lm/mbee/config/entrypoint.sh
