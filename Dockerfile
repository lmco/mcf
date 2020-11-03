FROM registry.access.redhat.com/ubi7/ubi
WORKDIR /opt/mbee/mcf

ENV HTTP_PROXY="http://proxy-lmi.global.lmco.com:80" \
    HTTPS_PROXY="http://proxy-lmi.global.lmco.com:80" \
    http_proxy="http://proxy-lmi.global.lmco.com:80" \
    https_proxy="http://proxy-lmi.global.lmco.com:80" \
    NO_PROXY=127.0.0.1,localhost \
    MBEE_ENV=dev \
    NODE_ENV=production \
    CAFILE_DST="./certs/LockheedMartinCertificateAuthority.pem"

# Create mbee user
RUN groupadd -r mbee -g 1000 && useradd -u 1000 -r -g mbee -m -d /opt/mbee -s /sbin/nologin -c "MBEE user" mbee && \
    chmod 755 -R /opt/mbee

USER mbee

# Copy Project
COPY . ./

# Update proxy and install auxiliary packages
RUN echo proxy=$http_proxy >> /etc/yum.conf \
    && echo sslverify=false >> /etc/yum.conf

RUN yum install -y wget git

# Install NodeJS 12
RUN wget https://nodejs.org/dist/v12.18.4/node-v12.18.4-linux-x64.tar.gz --no-check-certificate \
    && tar --strip-components 1 -xzvf node-v* -C /usr/local

# Set npm proxy settings and perform global yarn install
RUN npm set cafile $CAFILE_DST \
    && npm config set http_proxy $http_proxy \
    && npm config set https_proxy $https_proxy \
    && npm install -g yarn

# Create log and artifact project directories
RUN mkdir logs \
    && mkdir -p data/artifacts \
    && mkdir -p all_plugins

COPY ./plugins all_plugins

# Set yarn proxy settings
RUN yarn config set cafile $CAFILE_DST \
    && yarn config set http_proxy $http_proxy \
    && yarn config set https_proxy $https_proxy

RUN NOPOSTINSTALL=1 NOPREINSTALL=1 yarn install --production

EXPOSE 9080 9443

# Run server
ENTRYPOINT ["/bin/bash", "-c"]
CMD ["node mbee start"]
