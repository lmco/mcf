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

RUN mkdir -p app \
    && mkdir -p certs \
    && mkdir -p config \
    && mkdir -p plugins \
    && mkdir -p public \
    && mkdir -p scripts \
    && mkdir -p node_modules

COPY ./app  app
COPY ./certs certs
COPY ./config/*.cfg config/
COPY ./config/*.json config/
COPY ./plugins plugins
COPY ./build build
COPY ./scripts scripts
COPY ./package.json package.json
COPY ./mbee.js mbee.js
COPY ./node_modules node_modules
COPY ./README.md README.md

# Set proxy environment variables
ENV HTTP_PROXY="http://proxy-lmi.global.lmco.com:80" \
    HTTPS_PROXY="http://proxy-lmi.global.lmco.com:80" \
    http_proxy="http://proxy-lmi.global.lmco.com:80" \
    https_proxy="http://proxy-lmi.global.lmco.com:80" \
    NO_PROXY=127.0.0.1,localhost,*.lmco.com \
    MBEE_ENV=production \
    NODE_TLS_REJECT_UNAUTHORIZED=0

# Install dependencies
RUN apk upgrade && \
    apk update && \
    apk add git && \
    apk add openssh-client && \
    chmod 400 certs/* && \
    mkdir logs

# Run server
CMD ["node", "mbee.js", "start"]
