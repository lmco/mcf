# MBEE.js

## Getting started
This assumes developers are working in OSX.

### Prerequisites

1. Git
2. Homebrew
3. Node.js - Run `brew install node`
4. Yarn - Run `brew install yarn`
5. MongoDB - Run `brew install mongodb`

**Configuration for the LMI**
When on the Lockheed Martin Intranet, you'll need to set up the proxy:

- Run `yarn config set "http-proxy" http://proxy-lmi.global.lmco.com`
- Run `yarn config set "https-proxy" http://proxy-lmi.global.lmco.com`

You'll also need to download and set up the certificate authority:

- Download the ca file from `https://sscgit.ast.lmco.com/projects/CP/repos/openstack-hot/browse/PEM_LMChain_20160721.pem?raw`
- Run `yarn config set "cafile" /path/to/your/cafile.pem`

### Database Set Up
The current database used for MBEE is [mongoDB](https://www.mongodb.com/). To 
get the database up and running, set up a database folder for mongoDB to use and
then start up the database.

- Make the database directory `mkdir -p /Path/To/Your/DB/Folder`
- Start mongo with `mongod --dbpath /Path/To/Your/DB/Folder`
- Then create the default users:

```mongodb
use admin
db.createUser(
  {
    user: "admin",
    pwd: "admin",
    roles: [{ 
        role: "userAdminAnyDatabase", 
        db: "admin" 
    }]
  }
)

use mbee
db.createUser({
    user: "mbee", 
    pwd: "mbee", 
    roles: [{
        role: "readWrite", 
        db: "mbee"
    }]
})

use wiki
db.createUser({
    user: "wiki", 
    pwd: "relativeUniverse141", 
    roles: [{
        role: "readWrite", 
        db: "wiki"
    }]
})
```

- Shutdown mongo and restart it with `mongod --auth --dbpath /Path/To/Your/DB/Folder`.

For additional information on setting up authentication, follow the directions 
found [here](https://docs.mongodb.com/manual/tutorial/enable-authentication/).

The database configuration can be set up in the package.json file under 
mbee-config.database. The URL, Port, Database name, and Username and Password 
for authentication can be configured here.

Note: If the database is not using authentication, leave username and password 
as empty strings ('').

### Get the Code, Build, and Run 
1. Clone the repository: `git clone https://git.lmms.lmco.com/mbee/mbee.git && cd mbee`
2. Build and Run MBEE: `yarn run start`

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
