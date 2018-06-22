# Model-Based Engineering Environment

The Model-Based Engineering Environment or MBEE is a platform that allows
system models to be leveraged in a web-based user interface (UI) for increased
access and ease of use across disciplines and skill sets within an organization.
MBEE provides a web-based UI for people to interact with system model data
without needing to be a systems modeler themselves.

The goal of MBEE is to better communicate data across engineering organizations
by implementing the core goals of model-based systems engineering through
software tools. MBEE decreases ambiguity by making a single-source of truth for
data more achievable through its RESTful API, extensible plugins, and
distributed microservices.

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

#### Lockheed Martin Specific Setup
> This section is LOCKHEED MARTIN PROPRIETARY INFORMATION
> Remove this section before public release.

TODO - describe LMI setup

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

For more information on configuration, see the
[configuration section](#configuration) below.

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

The `mbee.js` script support a number of subcommands that typically map to the
scripts found in the `scripts` directory. The subcommands are designed to align
with the script commands in the `package.json` file.

The intention behind this approach is to give you more than one way to
accomplish the same thing, regardless of your preferred toolset without seeing
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

TODO - Talk more about MongoDB set up.


## Configuration

TODO - Talk more about configuration


## Test

### Test Framework Overview
Tests will be executed in order. To do this effectively without having to
rename the entire test collection when a new test suite is added somewhere in
the middle, the following naming conventions are used to number tests:

All tests will begin with a three digit number. The first two digits denote its
category

- **00X:** Reserved for future use of initialization tasks. These should not be
  used, but may be used later to perform pre-testing tasks.
- **10X:** Tests of the test framework and basic infrastructure itself. These
  should be used to identify basic configuration issues such as problems
  with test tools like Mocha, Chai, or similar.
- **20X:** These should be used for unit tests of libraries and helpers.
- **30X:** These should be used for unit tests of data layer models.
- **40X:** The should be used for controller tests.
- **50X:** These should be used to unit test views.
- **60X:** These should be used for API tests.
- **70X:** These should be used for UI tests.
- **80X:** These should be used for integration and system level tests.
- **90X:** Reserved for future use of wrap-up tasks to be used in conjunction
  with *00* initialization tasks.

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
TODO - Describe how to run tests

### Writing Tests
Tests are written in the form of a *test suite*.


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

