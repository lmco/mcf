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

RUN mkdir -p /lm/mbee/app \
 && mkdir -p /lm/mbee/bin \
 && mkdir -p /lm/mbee/certs \
 && mkdir -p /lm/mbee/plugins \
 && mkdir -p /lm/mbee/public

COPY ./app /lm/mbee/app
COPY ./certs /lm/mbee/certs
COPY ./plugins /lm/mbee/plugins
COPY ./public /lm/mbee/public
COPY ./bin/server.js /lm/mbee/bin/server.js
COPY ./package.json /lm/mbee/package.json

# Set proxy environment variables
ENV HTTP_PROXY="http://proxy-lmi.global.lmco.com:80" \
    HTTPS_PROXY="http://proxy-lmi.global.lmco.com:80" \
    http_proxy="http://proxy-lmi.global.lmco.com:80" \
    https_proxy="http://proxy-lmi.global.lmco.com:80" \
    NO_PROXY=127.0.0.1,localhost,*.lmco.com \
    NODE_ENV=production \
    NODE_TLS_REJECT_UNAUTHORIZED=0

# Yarn config
RUN yarn config set "http-proxy" $HTTP_PROXY \
 && yarn config set "https-proxy" $HTTPS_PROXY \
 && yarn config set "strict-ssl" false \
 && yarn config set "cafile" ./certs/LockheedMartinRootCertificationAuthority.pem 

# Install dependencies
RUN yarn install

# Expose ports
EXPOSE 8080 8443

# Run server
CMD ["yarn", "run", "server"]
