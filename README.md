# MBEE.js

## Getting started

> This assume developers are working in OSX.

Follow these steps to get MBEE up and running:

### Prerequisites
Ensure that Git and Homebrew are installed.

**Install Node.js**
Run `brew install node`

**Install Yarn** 
Run `brew install yarn`

When on the Lockeed Martin Intranet, you'll need to set up the proxy:

- Run `yarn config set "http-proxy" http://proxy-lmi.global.lmco.com`
- Run `yarn config set "https-proxy" http://proxy-lmi.global.lmco.com`

You'll also need to download and set up the certificate authority:

- Download the ca file from `https://sscgit.ast.lmco.com/projects/CP/repos/openstack-hot/browse/PEM_LMChain_20160721.pem?raw`
- Run `yarn config set "cafile" /path/to/your/cafile.pem`

### Get the Code 

1. Clone the repository: `git clone https://git.lmms.lmco.com/mbee/mbee.git`
2. Enter the directory: `cd mbee`

### Build and Run 
1. Install node modules: `yarn install`
2. Build MBEE: `yarn run build`
3. Run the server: `yarn run start`

Your server should now be running on port 8080.

Try the following URLs to test it:

- http://localhost:8080
- http://localhost:8080/api/version
- http://localhost:8080/admin/console