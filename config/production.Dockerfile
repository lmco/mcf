##
# Classification: UNCLASSIFIED                                                                                                        #
#
# @module config.Dockerfile
#
# @copyright Copyright (C) 2018, Lockheed Martin Corporation
#
# LMPI WARNING: This file is Lockheed Martin Proprietary Information.
# It is not approved for public release or redistribution.
#
# @description This Dockerfile defines the Docker build for MBEE.
##
FROM node:6.14.1
MAINTAINER Lockheed Martin
WORKDIR /lm/mbee

# Set proxy environment variables
ENV HTTP_PROXY="http://proxy-lmi.global.lmco.com:80" \
    HTTPS_PROXY="http://proxy-lmi.global.lmco.com:80" \
    http_proxy="http://proxy-lmi.global.lmco.com:80" \
    https_proxy="http://proxy-lmi.global.lmco.com:80" \
    NO_PROXY=127.0.0.1,localhost

# Install dependencies
RUN apt-get -y upgrade \
 && apt-get -y update \
 && apt-get install -y git \
 && apt-get install -y openssh-client

# Install certs - If you have certs in a certs directory, uncomment the following lines
RUN mkdir -p certs
COPY ./certs certs
RUN chmod 400 certs/*

# Configure Yarn
RUN yarn config set proxy http://proxy-lmi.global.lmco.com:80 \
    && yarn config set cafile "./certs/LockheedMartinCertificateAuthority.pem" \
    && yarn config set http-proxy "http://proxy-lmi.global.lmco.com" \
    && yarn config set https-proxy "http://proxy-lmi.global.lmco.com"

# Install modules using yarn from the package.json
COPY ./package.json package.json
RUN yarn install --production

# Create project directory structure
RUN mkdir logs \
    && mkdir -p config \
    && mkdir -p scripts \
    && mkdir -p plugins \
    && mkdir -p build \
    && mkdir -p public \
    && mkdir -p app

# Copy Project
COPY ./config config
COPY ./scripts scripts
COPY ./mbee.js mbee.js
COPY ./plugins plugins
COPY ./build build
COPY ./app  app
COPY ./README.md README.md

# Expose ports
EXPOSE 6233
EXPOSE 6234

# Run server
CMD ["node", "mbee.js", "start"]
