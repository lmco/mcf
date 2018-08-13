###############################################################################
# Classification: UNCLASSIFIED                                                #
#                                                                             #
# Copyright (C) 2018, Lockheed Martin Corporation                             #
#                                                                             #
# LMPI WARNING: This file is Lockheed Martin Proprietary Information.         #
# It is not approved for public release or redistribution.                    #
#                                                                             #
# EXPORT CONTROL WARNING: This software may be subject to applicable export   #
# control laws. Contact legal and export compliance prior to distribution.    #
###############################################################################
#
# Dockerfile
#
# Josh Kaplan <joshua.d.kaplan@lmco.com>
#
# This Dockerfile defines the Docker build for MBEE.
#
###############################################################################
FROM node:6.14.1-alpine
MAINTAINER Josh Kaplan <joshua.d.kaplan@lmco.com>
WORKDIR /lm/mbee

# Set proxy environment variables
ENV HTTP_PROXY="http://proxy-lmi.global.lmco.com:80" \
    HTTPS_PROXY="http://proxy-lmi.global.lmco.com:80" \
    http_proxy="http://proxy-lmi.global.lmco.com:80" \
    https_proxy="http://proxy-lmi.global.lmco.com:80" \
    NO_PROXY=127.0.0.1,localhost,*.lmco.com \
    NODE_TLS_REJECT_UNAUTHORIZED=0

# Install dependencies
RUN apk upgrade \
    && apk update \
    && apk add git \
    && apk add openssh-client

# Install certs
RUN mkdir -p certs
COPY ./certs certs
RUN chmod 400 certs/*

# Install Yarn Modules
RUN yarn config set proxy http://proxy-lmi.global.lmco.com:80 \
    && yarn config set cafile "certs/LockheedMartinRootCertificationAuthority.pem" \
    && yarn config set strict-ssl false \
    && yarn config set http-proxy "http://proxy-lmi.global.lmco.com" \
    && yarn config set https-proxy "http://proxy-lmi.global.lmco.com"

# Install modules using yarn from the package.json
COPY ./package.json package.json
RUN yarn install --production

# Create Project Directory Structure
RUN mkdir logs \
    && mkdir -p config \
    && mkdir -p scripts \
    && mkdir -p plugins \
    && mkdir -p build \
    && mkdir -p public \
    && mkdir -p app

# Copy Project
COPY ./config/*.cfg config/
COPY ./config/*.json config/
COPY ./scripts scripts
COPY ./mbee.js mbee.js
COPY ./plugins plugins
COPY ./build build
COPY ./app  app
COPY ./README.md README.md

# Run server
CMD ["node", "mbee.js", "start"]
