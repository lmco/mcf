# Model-Based Engineering Environment

The Model-Based Engineering Environment or MBEE is modeling collaboration tool
that integrates system models with multidisciplinary engineering data to enable
the system model to be a single-source of truth project data. It makes model
data more accessible via a web-based user interface (UI) for ease of use across
disciplines and skill sets within an organization. MBEE provides a web-based UI
for team members to interact with system model data without needing to be a
systems modeler themselves.

The goal of MBEE is to better communicate data across engineering organizations
by implementing the core goals of model-based systems engineering through
software tools. MBEE decreases ambiguity by making a single-source of truth for
data more achievable through its RESTful API, extensible plugins, and
distributed services.

## Quick Start

### Prerequisites

MBEE is designed so that the only dependency to get started is Node.js and NPM.
NPM comes with Node.js, all you need to do is make sure you can install packages
with NPM and you can get started.

You'll also need an instance MongoDB. If you don't have a database already set
up, please see the [MongoDB Installation Tutorial](https://docs.mongodb.com/manual/installation/#tutorial-installation)
and the [MongoDB Getting Started Guide](https://docs.mongodb.com/manual/tutorial/getting-started/)
for up-to-date documentation on MongoDB.

Finally, you need to clone the MBEE code by running:
`git clone https://gitlab.lmms.lmco.com/mbee/mbee.git `. And enter the directory
with `cd mbee`.

### Configuring MBEE

MBEE stores all it's configuration information in the `config` directory. By
default, it uses the `default.cfg` file, but that can be changed by setting the
`MBEE_ENV` environment variable. On startup, MBEE will load the configuration
file with a name matching the `MBEE_ENV` environment variable. For example,
if `MBEE_ENV=production`, MBEE will look for the file `config/production.cfg`.

The MBEE config is simply a JSON file that allows comments. MBEE is designed to
be largely parameterized by this config file. In this config file you will have
options to alter the server ports, Docker configurations, enabling and
disabling components, and swapping out authentication schemes. For a
more detailed explanation of the fields supported by the config file, see the
detailed comments provided [example.cfg](config/example.cfg).

To get started, you should edit the [default.cfg](config/default.cfg) to support
your configuration.

### Modular Authentication

MBEE supports modular authentication strategies. These authentication modules
have well defined interfaces that can be dynamically replaced. This allows you
to write a custom authentication module to accommodate the needs of your
company or organization without having to make major changes to MBEE. You can
then specify which authentication module to use in the MBEE config file.

Alter the `auth.strategy` field in the [default.cfg](config/default.cfg)
to use your authentication strategy.

### Building MBEE

1. Install dependencies by running `NODE_ENV=dev yarn install` or
`npm install --dev`.
2. Build MBEE by running `node mbee build`. This will build the client-side
assets by moving dependencies from `node_modules` into build/public, concatenating and
minifying client-side JavaScript, processing Sass into CSS, and building JSDoc
documentation into build/doc.

> How it works: The build command ultimately calls the script `scripts/build.js`
> and the package.json contains a "build" script definition that also points to
> this script. You can also build by running `npm build` or `yarn run build`.

#### NPM, Yarn, and mbee.js

NPM is the default package manager that comes with Node.js. MBEE is
designed so that NPM could be used to build and run MBEE without issues. Yarn
is used instead because it handles dependency management a bit more effectively
than NPM with little to no additional effort.

The `package.json` file defines scripts that NPM or Yarn can run. These mostly
map to either files in the `scripts` directory or to the `mbee.js` script.

The `mbee.js` script supports a number of subcommands that typically map to the
scripts found in the `scripts` directory. The subcommands are designed to align
with the script commands in the `package.json` file.

The intention behind this approach is to give you more than one way to
accomplish the same thing, regardless of your preferred toolset, without seeing
different behavior between approaches.

In short, you can also build MBEE with `npm run build`, `yarn build`, or
`node scripts/build.js`. They'll all do the same thing.

It is possible to build individual pieces of MBEE as well. By default, running
the build script will build all pieces of MBEE, or by providing the subcommand
--all or --copy-deps. Additional subcommands are --sass, --react and --jsdoc to
build the sass, react and jsdoc files respectively.

### Running MBEE

The fastest and easiest way to run MBEE is to run `node mbee start`. This will
run the MBEE server based on the [default.cfg](config/default.cfg) by
default. To run with a different configuration (`production` for example), run
`NODE_ENV=production node mbee start`.

> How it works: The start command loads the app from the `app/app.js` module
> and creates (if enabled) the HTTP and HTTPS servers and starts the MBEE
> servers.

## Configuration

### Modular Authentication

By default, MBEE provides strategies for local authentication or LDAP
authentication. Local is used by default because it has fewer dependencies and
is easiest to get started. LDAP can be used by specifying that strategy in the
[default.cfg](config/default.cfg) and altering the `auth.ldap` section of the
config to define your LDAP configuration.

An authentication module has the following requirements:

- It must be located in the `app/auth` directory.
- It must implement and export the following functions
    - handleBasicAuth(req, res, username, password) - Returns a Promise
    - handleTokenAuth(req, res, token) - Returns a Promise
    - doLogin(req, res, next)

The `handleBasicAuth()` and `handleTokenAuth()` functions both defines how to
authenticate users for their respective input types. Both objects are passed the
request object, `req`, and response object, `res`. `handleBasicAuth()` is
passed the username and password which is obtained from either the authorization
header or form input depending on which is provided (with the former taking
precedence). `handleTokenAuth()` is passed a token which is retrieved either from
the authorization header or the `req.session.token` field (with the former
taking precedence). Both of these functions must return promise that resolves
the user object on success or rejects with an error if authentication fails.

The `doLogin()` function defines what actions should be done to actually log the
user in when authentication succeeds. This function is called for the following
routes:
    - `/api/login`: This function should set the `req.session.token` and call
    `next()` when done. Control will then be passed to the API controller which
    will return the token in the form `{ "token": "yourReqSessionToken" }`
    -`/login`: This function should perform login actions such as setting the
    `req.session.token` value then call `next()` when done which will handle
    appropriate redirection of the user.

## Test

### Test Framework Overview

Tests will be executed in numeric order. To do this effectively, the following
naming conventions are used to number tests:

All tests will begin with a three digit number. The first two digits denote its
category

- **0xx:** Reserved for initialization tasks. These should be used for any
  database initialization or other tasks to be done before all tests.
- **1xx:** Tests the test framework and basic infrastructure. These
  should be used to identify basic configuration issues like Mocha or Chai or
  to identify simple errors such as a missing files.
- **2xx:** These should be used for unit tests of libraries and helpers. It can
           also be used for other basic tests that have few or no dependencies.
- **3xx:** These should be used for unit tests of data models.
- **4xx:** These should be used for controller tests.
- **5xx:** These should be used to test the API via mock requests.
- **6xx:** These should be used for API tests while running the MBEE server.
- **7xx:** These should be used for UI tests while running the MBEE server.
- **8xx:** These should be used for integration and system level tests.
- **9xx:** Reserved for wrap-up tasks to be used in conjunction
           with *0xx* initialization tasks.

All tests will begin with a three digit number. The full name of the test,
seen by Mocha, should correspond to the name of the file.

> **How it works:** Mocha tests are a collection of `it` functions wrapped in
> a `describe` function. The first parameter passed to the describe function is
> the test name. We dynamically grab the file name of the current file and pass
> that into the describe function. This ensures that the test name as seen by
> Mocha corresponds to the file name containing the test.

These test numbers are used both to uniquely identify the tests and to define
their order of execution.

### // TODO: Document the 6XX tests certs MBX-470

### Code Conventions and ESLint

While this isn't strictly a testing topic, it is a good practice that relates to
testing as it helps avoid inconsistencies or problems in the code base. We use
ESLint to maintain certain standards and conventions in our code.

You can start by simply running the linter by running `node mbee lint`. The
rule set for ESLint is defined in the [.eslintrc](.eslintrc) file and aligns with
our style guide.

We also recommend using EditorConfig. The [.editorconfig](.editorconfig) file
in the project's root directory will help enforce some of those style conventions.

### Running Tests

Tests can be run by running the `node mbee test` command. Alternatively, this
can be done by running `node scripts/test`, `yarn run test`, or `npm test`.
Ultimately, this maps to a shell command that runs `mocha` and passes any
command line arguments to Mocha.

To run specific tests, you can pass in a regular expression via Mocha's `--grep`
flag. This regex will run only tests starting with that name. For example:

```
node mbee test --grep "^[0-4]"   # Runs tests 000 - 499
node mbee test --grep "^301"     # Runs test 301
node mbee test --grep "^6[0-2]"  # Runs tests 600-629
```

Any other Mocha arguments are valid to pass to the test command.

### Writing Tests

Tests are written in the form of a *test module* which contains a collection
of tests. The test module must contain a single top-level `describe` function
(see [Mocha's Documentation](https://mochajs.org/#getting-started) for more
detail).

Each test module name should begin with a three-digit number which uniquely
identifies the test and determines the order in which it runs. That module
should be stored in the appropriately numbered directory within the test
directory.

Here are some guidelines for writing unit tests:

1. **Start with expected behavior.** Does the code do what it's supposed to do
when given valid input? Include a few test cases. For example: for a *User*
model. Make sure to add a user, delete a user, modify users, etc.
2. **Hit corner cases.** If there is unusual or unexpected input, make sure to
test it. For example: What if a user has a really long user name or email?
3. **Test invalid input.** Make sure it properly handles invalid input as you
would expect it to. For example: What if you try to add a user with an invalid
name or email? Or, what if you try to add a user that already exists?
4. **Leave the system in the state it started in.** Make sure the test suite
leaves the system in the same state it started in. For example if you added a
project, delete it. This allows unit tests to be written without knowledge of
other test suites or the order of test execution.


## Documentation

### API Documentation
The API's documentation is generated with Swagger with Swagger-JSDoc.
The API routes, which are defined in [app/api-routes.js](app/api-routes.js),
are documented via Swagger-JSDoc block comments. All API documentation and
API definition occurs in that file.

You can view the rendered Swagger documentation at the `/doc` route on a
running MBEE server.

### Developer Documentation
Developer documentation created using [JSDoc](http://usejsdoc.org/). When
writing code, you are expected to document what you're doing to help other
developers and maintainers understand what you are doing, support code reviews,
and make it easier for people to understand and work with the project.

The developer documentation is generated and rendered by the
[MBEE developers plugin](https://gitlab.lmms.lmco.com/mbee/mbee-integrations/plugin-developers.git).
Ensure this plugin is added to your configuration and you can view the
rendered developer documentation within that plugin.

Alternatively, you can run

```bash
node node_modules/jsdoc/jsdoc.js \
     -u doc app/**/*.js test/**/*.js README.md
```
