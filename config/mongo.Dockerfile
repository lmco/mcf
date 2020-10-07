FROM registry.access.redhat.com/ubi7/ubi

# Set proxy environment variables
ENV HTTP_PROXY="http://proxy-lmi.global.lmco.com:80" \
    HTTPS_PROXY="http://proxy-lmi.global.lmco.com:80" \
    http_proxy=$HTTP_PROXY \
    https_proxy=$HTTPS_PROXY \
    NO_PROXY=127.0.0.1,localhost

# Set mongo version environment variable
ENV MONGO_VERSION 4.4

# Add Mongo RHEL repo
RUN echo  $'[mongodb-org-4.4] \n\
name=MongoDB Repository \n\
baseurl=https://repo.mongodb.org/yum/redhat/$releasever/mongodb-org/4.4/x86_64/ \n\
gpgcheck=1 \n\
enabled=1 \n\
gpgkey=https://www.mongodb.org/static/pgp/server-4.4.asc' >> /etc/yum.repos.d/mongodb-org.repo

# Update proxy in yum conf
RUN echo -e proxy=$HTTP_PROXY '\nsslverify=false' >> /etc/yum.conf

# Install MongoDB
RUN yum install -y mongodb-org

# Create db dir
RUN mkdir -p /data/db && chown -R mongod:mongod /data/db

# Expose port 27017
EXPOSE 27017

# Start MongoDB
ENTRYPOINT [ "mongod"]
CMD ["--bind_ip_all"]
