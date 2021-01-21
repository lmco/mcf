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

# Change permission on entrypoint and mbee directory
RUN chmod +x ./docker-entrypoint.sh \
    && chmod 755 /opt/mbee \
    && chown -R mcf:mcf /opt/mbee

# Init mcf user
USER mcf

# Init git configuration
RUN git init \
    && git config user.email "mbee-service.fc-ssc@lmco.com" \
    && git config user.name "MBEE Container Runtime" \
    && git add . \
    && git commit -m "Initialize Container" -q

# Update permissions and install plugin dependencies
RUN chmod +x ./scripts/install-plugin-modules.sh
RUN ./scripts/install-plugin-modules.sh

# Install yarn packages
RUN NOPOSTINSTALL=1 NOPREINSTALL=1 yarn install

VOLUME all_plugins
EXPOSE 9080 9443

# Run server
ENTRYPOINT ["/opt/mbee/docker-entrypoint.sh"]

CMD ["node","mbee","start"]

