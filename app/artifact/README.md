# Supported Artifact Configurations

MBEE supports two types of Artifact storage strategies. MBEE utilities
artifact strategies for Blobs storage. (arbitrary binary files)
All artifact strategy requires implementation of specific functions for
MBEE to work. There configuration, however, may require different metadata.

Below are a list of currently supported artifact strategies and how to
configure each to work with MBEE.

### Local Strategy Configuration
Local strategy stores Blobs locally on the same server that MBEE runs on.

To configure MBEE to use the local strategy, the following `artifact` section
of the running config should be configured as follows:

```json
"artifact": {
    "strategy": "local-strategy"
  }
```

### Amazon S3 Strategy Configuration
Requires an existing Amazon s3 account, bucket, and user with full
role to access the bucket via Access Key Id and Secret Access.

To configure MBEE to use the remote s3 strategy, the following `artifact` section
of the running config should be configured as follows:

```json
"artifact": {
    "strategy": "s3-strategy",
    "s3": {
      "accessKeyId": "your-access-key-id",
      "secretAccessKey": "your-secret-access-key",
      "region": "your-region",
      "Bucket": "your-bucket-name",
      "ca": "your/ssl/cert.pem",
      "proxy": "http://your-proxy.com:80"
    }
  }
```

