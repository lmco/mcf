# Model-Based Engineering Environment

TODO

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
up, see our section on [setting up MongoDB](#setting-up-mongodb). Once MongoDB
is set up, you just need to configure MBEE to point to it.

Finally, you need to clone the MBEE code by running:
`git clone https://gitlab.lmms.lmco.com/mbee/mbee.git `. And enter the directory
with `cd mbee`.


### Configuring MBEE
MBEE stores all it's configuration information in the `config` directory. By
default, it uses the `dev.json` file, but that can be changed by changing the
`NODE_ENV` environment variable. On startup, MBEE will load the configuration
file with a name matching the `NODE_ENV` environment variable. For example,
if `NODE_ENV=production`, MBEE will look for the file `config/production.json`.

MBEE is designed to be largely parameterized by this config file, you'll find
options in the config to update the server ports, Docker configurations,
enabling and disabling components, and swapping out authentication schemes.

To configure the database enter your database connection information in the `db`
section of the config. For example:

```json
{
  "db": {
    "name": "test",
    "url": "localhost",
    "port": "27017",
    "username": "mbee",
    "password": "mbee",
    "ssl": false
  }
}
```

For more information please see the detailed comments in the provided
[example.cfg](config/example.cfg).

### Building MBEE

The easiest way to build MBEE is to run `node mbee build`. This will install
dependencies and build MBEE.

> How it works: The build command (which calls the script `scripts/build.js`)
> first uses NPM to install Yarn, an alternative to NPM, and configures it
> according to the `yarn` section of the config file. It then runs
> `yarn install --dev` to install all dependencies. Finally, it runs the build
> function defined in the build.js script to copy dependencies, build sass and
> Javascript and similar tasks required for MBEE to run.

#### NPM, Yarn, and mbee.js

NPM is the default package manager that comes with with Node.js. MBEE is
designed to that NPM could be used to build and run MBEE without issue. Yarn
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

### Running MBEE

The fastest and easiest way to run MBEE is to run `node mbee start`. This will
run the MBEE server based on the configuration file (`config/dev.json` by
default). To run with a different configuration (`production` for example), run
`NODE_ENV=production node mbee start`.

> How it works: The start command loads the app from the `app/app.js` module
> and creates (if enabled) the HTTP and HTTPS servers and starts the servers.


## Setting Up MongoDB

Please see the [MongoDB Installation Tutorial](https://docs.mongodb.com/manual/installation/#tutorial-installation)
and the [MongoDB Getting Started Guide](https://docs.mongodb.com/manual/tutorial/getting-started/)
for up-to-date documentation on MongoDB.


## Test
// TODO: Document the 600 tests certs
### Test Framework Overview
Tests will be executed in order. To do this effectively without having to
rename the entire test collection when a new test suite is added somewhere in
the middle, the following naming conventions are used to number tests:

All tests will begin with a three digit number. The first two digits denote its
category

- **0xx:** Reserved for initialization tasks. These should be used for any
  database initialization or other tasks to be done before all tests.
- **1xx:** Tests of the test framework and basic infrastructure itself. These
  should be used to identify basic configuration issues such as problems
  with test tools like Mocha or Chai or to identify simple errors such as
  missing files or other errors.
- **2xx:** These should be used for unit tests of libraries and helpers. It can
  also be used for other basic tests that have few or no dependencies on other
  modules.
- **3xx:** These should be used for unit tests of data models.
- **4xx:** The should be used for controller tests.
- **5xx:** These should be used to unit test the API via mock requests.
- **6xx:** These should be used for API tests of a running server.
- **7xx:** These should be used for UI tests of a running server.
- **8xx:** These should be used for integration and system level tests.
- **9xx:** Reserved for wrap-up tasks to be used in conjunction
  with *0xx* initialization tasks.

All each test module begins with a three digit number. The full name of the test
as it is seen by Mocha should correspond to the name of the file.

> **How it works:** Mocha tests are a collection of `it` functions wrapped in
> a `describe` function. The first parameter passed to the describe function is
> the test name. We dynamically grab the file name of the current file and pass
> that into the describe function. This ensures that the test name as seen by
> Mocha corresponds to the file name containing the test.

These test numbers are used both to uniquely identify the tests and to define
their order of execution.

## Code Conventions and ESLint
While this isn't strictly a testing topic, it is a good practice that relates to
testing as it helps avoid inconsistencies or problems in the code base. We use
ESLint to maintain certain standards and conventions in our code.

You can start by simply running the linter by running `node mbee lint`. The
rule set for ESLint is defined in the `.eslintrc` file and aligns with our
style guide.

We also recommend using EditorConfig. The `.editorconfig` file in the project's
root directory will help enforce some of those style conventions.

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
The API is documentation is generated with Swagger with Swagger-JSDoc.
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
Simple ensure this plugin is added to your configuration and you can view the
rendered developer documentation within that plugin.

Alternatively, you can run

```bash
node node_modules/jsdoc/jsdoc.js \
     -u doc app/**/*.js test/**/*.js README.md
```
