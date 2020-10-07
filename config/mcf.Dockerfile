FROM registry.access.redhat.com/ubi7/ubi
WORKDIR /opt/mcf

# Set proxy environment variables
ENV HTTP_PROXY="http://proxy-lmi.global.lmco.com:80" \
    HTTPS_PROXY="http://proxy-lmi.global.lmco.com:80" \
    http_proxy="http://proxy-lmi.global.lmco.com:80" \
    https_proxy="http://proxy-lmi.global.lmco.com:80" \
    NO_PROXY=127.0.0.1,localhost \
    NODE_ENV=production \
    MBEE_ENV=production \
    CA_CERT="./certs/LockheedMartinCertificateAuthority.pem"

# Install certs - If you have certs in a certs directory, uncomment the following lines
RUN mkdir -p certs
COPY ./certs certs
RUN chmod 400 certs/*

# Create project directory structure
RUN mkdir logs \
    && mkdir -p config \
    && mkdir -p scripts \
    && mkdir -p plugins \
    && mkdir -p all_plugins \
    && mkdir -p build \
    && mkdir -p public \
    && mkdir -p app \
    && mkdir -p /opt/mcf/data/db/log \
    && mkdir -p node_modules

# Copy Project
COPY ./config config
COPY ./scripts scripts
COPY ./mbee.js mbee.js
COPY ./app  app
COPY ./README.md README.md
COPY ./package.json package.json
COPY ./yarn.lock yarn.lock
COPY ./build build
COPY ./node_modules node_modules
COPY ./plugins plugins
COPY ./plugins all_plugins

# Update proxy in yum conf
RUN echo proxy=$HTTP_PROXY >> /etc/yum.conf \
    && echo sslverify=false >> /etc/yum.conf

# Install nodejs 12
RUN yum install -y wget
RUN wget https://nodejs.org/dist/v12.18.4/node-v12.18.4-linux-x64.tar.gz --no-check-certificate
RUN tar --strip-components 1 -xzvf node-v* -C /usr/local
RUN node -v

# Set npm proxy settings
RUN npm config set cafile $CA_CERT \
    && npm config set http_proxy $HTTP_PROXY \
    && npm config set https_proxy $HTTPS_PROXY \
    && npm config set strict-ssl false

# Install yarn globally
RUN npm install -g yarn

# Set yarn proxy settings
RUN yarn config set cafile $CA_CERT \
    && yarn config set http_proxy $HTTP_PROXY \
    && yarn config set https_proxy $HTTPS_PROXY

# Define a volume
VOLUME data

# Expose ports
EXPOSE 9080
EXPOSE 9443
EXPOSE 27017

# Run server
ENTRYPOINT ["/bin/bash", "-c"]
CMD ["npm start"]
