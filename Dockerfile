# FROM registry.access.redhat.com/ubi7/ubi
ARG BASE_TAG="12"
FROM jfrog.swf.mbx.us.lmco.com/mbx-docker/base-node:${BASE_TAG}

# Create mbee user and run mcf under that context
RUN groupadd -r mcf -g 1020 \
     && useradd -u 1020 -r -g mcf -m -d /opt/mbee -s /sbin/nologin -c "MCF user" mcf

WORKDIR /opt/mbee

ENV MBEE_ENV="pipeline" \
    CAFILE_DST="./certs/LockheedMartinCertificateAuthority.pem" \
    NODE_ENV="development"

# Copy Project
COPY . ./

# Create log and artifact project directories
RUN mkdir logs \
    && mkdir -p data/artifacts \
    && mkdir -p all_plugins

COPY ./plugins all_plugins

# Install Prince
RUN curl -kL -o ./prince-13.5-1.centos7.x86_64.rpm \
    https://www.princexml.com/download/prince-13.5-1.centos7.x86_64.rpm --proxy $http_proxy \
    && yum install -y ./prince-13.5-1.centos7.x86_64.rpm \
    && rm prince-13.5-1.centos7.x86_64.rpm

RUN chmod 755 /opt/mbee \
    && chown -R mcf:mcf /opt/mbee

USER mcf

RUN git init \
    && git config user.email "mbee-service.fc-ssc@lmco.com" \
    && git config user.name "MBEE Container Runtime" \
    && git add . \
    && git commit -m "Initialize Container" -q

# Update proxy and install auxiliary packages
# RUN echo proxy=$http_proxy >> /etc/yum.conf \
#     && echo sslverify=false >> /etc/yum.conf

# Install wget and git
# RUN yum install -y wget git

# Install NodeJS 12
# RUN wget https://nodejs.org/dist/v12.18.4/node-v12.18.4-linux-x64.tar.gz --no-check-certificate \
#     && tar --strip-components 1 -xzvf node-v* -C /usr/local

# Set npm proxy settings and perform global yarn install
# RUN npm set cafile $CAFILE_DST \
#     && npm config set http_proxy $http_proxy \
#     && npm config set https_proxy $https_proxy \
#     && npm install -g yarn

# Create mbee user and run mcf under that context
# RUN groupadd -r mbee -g 1000 \
#      && useradd -u 1000 -r -g mbee -m -d /opt/mbee -s /sbin/nologin -c "MBEE user" mbee \
#      && chmod 755 /opt/mbee \
#      && chown -R mbee:mbee /opt/mbee

# Set yarn proxy settings
# RUN yarn config set cafile $CAFILE_DST \
#     && yarn config set http_proxy $http_proxy \
#     && yarn config set https_proxy $https_proxy

RUN chmod +x ./scripts/install-plugin-modules.sh
RUN ./scripts/install-plugin-modules.sh

# RUN git init \
#     && git config user.email "mbee-service.fc-ssc@lmco.com" \
#     && git config user.name "MBEE Container Runtime" \
#     && git add . \
#     && git commit -m "Initialize Container" -q


RUN NOPOSTINSTALL=1 NOPREINSTALL=1 yarn install

# Create mbee user and run mcf under that context
# RUN groupadd -r mcf -g 1020 \
#     && useradd -u 1020 -r -g mcf -m -d /opt/mbee -s /sbin/nologin -c "MCF user" mcf \
#     && chmod 755 /opt/mbee \
#     && chown -R mcf:mcf /opt/mbee

# USER mcf

VOLUME all_plugins
EXPOSE 9080 9443

# Run server
ENTRYPOINT ["/bin/bash", "-c"]
CMD ["node mbee start"]
