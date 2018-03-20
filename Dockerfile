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
FROM node:9.5.0-alpine
MAINTAINER Josh Kaplan <joshua.d.kaplan@lmco.com>
WORKDIR /opt/lm/mbee

RUN mkdir -p /opt/lm/mbee/app \
 && mkdir -p /opt/lm/mbee/certs \
 && mkdir -p /opt/lm/mbee/public

COPY ./app /opt/lm/mbee/app
COPY ./certs /opt/lm/mbee/certs
COPY ./public /opt/lm/mbee/public
COPY ./config.json /opt/lm/mbee/config.json
COPY ./server.js /opt/lm/mbee/server.js
COPY ./package.json /opt/lm/mbee/package.json

# Set proxy environment variables
ENV HTTP_PROXY="http://proxy-lmi.global.lmco.com:80" \
    HTTPS_PROXY="http://proxy-lmi.global.lmco.com:80" \
    http_proxy="http://proxy-lmi.global.lmco.com:80" \
    https_proxy="http://proxy-lmi.global.lmco.com:80" \
    NO_PROXY=127.0.0.1,localhost
ENV NODE_ENV=production

# Yarn config
RUN yarn config set "http-proxy" $HTTP_PROXY \
 && yarn config set "https-proxy" $HTTPS_PROXY \
 && yarn config set "strict-ssl" false \
 && yarn config set "cafile" ./certs/LockheedMartinRootCertificationAuthority.pem 
ENV NODE_TLS_REJECT_UNAUTHORIZED=0

# Install dependencies
RUN yarn install
RUN yarn build 

# Expose ports
EXPOSE 8080 8443

# Run server
CMD ["yarn", "run", "server"]
