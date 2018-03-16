# MBEE.js

## Getting started
This assumes developers are working in OSX.

### Prerequisites

1. Git
2. Homebrew
3. Node.js - Run `brew install node`
4. Yarn - Run `brew install yarn`

**Configuration for the LMI**
When on the Lockheed Martin Intranet, you'll need to set up the proxy:

- Run `yarn config set "http-proxy" http://proxy-lmi.global.lmco.com`
- Run `yarn config set "https-proxy" http://proxy-lmi.global.lmco.com`

You'll also need to download and set up the certificate authority:

- Download the ca file from `https://sscgit.ast.lmco.com/projects/CP/repos/openstack-hot/browse/PEM_LMChain_20160721.pem?raw`
- Run `yarn config set "cafile" /path/to/your/cafile.pem`

### Get the Code, Build, and Run 
1. Clone the repository: `git clone https://git.lmms.lmco.com/mbee/mbee.git && cd mbee`
1. Build and Run MBEE: `yarn run start`

Your server should now be running on port 8080. Try the following URLs to test 
it:

- http://localhost:8080
- http://localhost:8080/api/doc
- http://localhost:8080/admin/console


## Documentation

### API Documentation
The API is documentation is generated with Swagger with Swagger-JSDoc.
The API routes, which are defined in [app/api_routes.js](app/api_routes.js),
are documented via Swagger-JSDoc block comments. All API documentation and 
API definition occurs in that file.

### Developer Documentation 
Developer documentation created using [JSDoc](http://usejsdoc.org/). When
writing code, you are expected to document what you're doing to help other
developers understand what you are doing (both internally and externally), 
support code reviews, and make it easier for people to understand and work with
the project.

To generate the documentation, a Gulp build task was written. You can run it 
with `gulp jsdoc` or with Yarn by running `yarn run jsdoc-gen`. Additionally,
a server was written to statically serve the documentation which can be found
in the `bin directory`.

Generate the documentation and serve it all at once with `yarn run jsdoc`.
