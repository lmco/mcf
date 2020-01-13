# Contributing to MBEE

**Contents**
- [Pull Requests](#pull-requests)
  - [Linter](#linter)
  - [Tests](#tests)
  - [Errors](#errors)
  - [Commenting](#commenting)
  - [DFARS Requirements](dfars-requirements)
- [Contributors](#contributors)

### Pull Requests
As an open-sourced project, MBEE is open to contributions from community members
who wish to enhance or fix portions of the software. Below are some quidelines
to follow which will help your pull request be approved and ultimatley keep the
code base clean, readable, and maintainable.

#### Linter
MBEE has been configured to use [ESLint](https://github.com/eslint/eslint) as
it's linter. The [.eslintrc](./.eslintrc) file found in the root directory
defines the rules and configurations which MBEE uses. A list of available ESLint
rules, as well as detailed descriptions of each, can be found
[here](https://eslint.org/docs/rules/).

Additionally, ESLint supports plugins which can add additional rules to the
linter. Currently, two plugins are added to the code base, 
[eslint-plugin-jsdoc](https://github.com/gajus/eslint-plugin-jsdoc) which lints
and enforces JSDoc headers and 
[eslint-plugin-security](https://github.com/nodesecurity/eslint-plugin-security)
which checks for possible security vulnerabilites in the code. Currently, a
custom ESLint plugin for MBEE is in the works, and further documentation on
defining rules in this custom plugin will be added when it is released.

For code to be merged in, it **must** successfully pass the linter without an
errors or warnings. To run the linter, run the command `node mbee lint` from the
root MBEE directory.

#### Tests
All code contributed to the MBEE code base **must** pass every unit tests. Tests
are written using the [mocha](https://mochajs.org/) framework, and take 
advantage of [chai](https://www.chaijs.com/) for easier assertions in the tests.
As MBEE tries to follow a test-driven development workflow, it is expected that
every piece of code merged in should modify or add new tests.

To run the tests, run the command `node mbee test --all` from the root MBEE
directory. Without providiing the `--all` command, only the suites 1, 2, 3, 4,
5, and 7 will be run. *Please note, the 0 and 9 tests suite will completely wipe
your database, so please ensure the data is backed up.*

#### Errors
Throughout the code, MBEE takes advantage of a [library](./app/lib/errors.js) of
custom errors. Each of these errors is associated with a specifc HTTP status
code which will be sent in response from the API. These errors are attached to
the global M object, and can be created like so:

```javascript
const err = new M.PermissionError('User does not have permission.');
```

All code merged in which has access to the global M object is expected to use
these custom errors. The only code which may not have access to the M object
would be found in the [scripts](./scripts).

#### Commenting
If you look at the majority of the code in MBEE, you will notice quite the
excess of comments to help support code readability. As a best practice, the
current developers try to follow a guideline of commenting at least every 5
lines. This may include a **required** JSDoc header before every function,
information about function calls/loops or any logic which may not be obvious at
first glance. All code merged in is expected to follow similar standards.

#### DFARS Requirements
To allow for MBEE to be used on all levels of DoD programs, the software has
been written to follow the DoD DFARS Requirements as best as possible. Currently
with the correct configuration, MBEE **can** be DFARS compliant, althought
efforts are being made to ensure all configurations meet the requirements.

All code merged in should be DFARS compliant; if the code breaks compliance, it
will not be merged in. The only exception to this rule is if the feature being
added is configurable, and can be turned off in systems which desire the
software to be complaint. If this is the case, it must be thoroughly documented
in the file header which components of the code break which requirement. A list
of the NIST requirements and detailed descriptions of each can be found
[here](https://nvlpubs.nist.gov/nistpubs/hb/2017/NIST.HB.162.pdf). Please note
that not every single requirement is affected by the software, many deal with
server configuration, training and even physical access to machines.


### Contributors
Thanks to all of the following people below who have directly contributed code
to MBEE

- Austin Bieber
- Danny Chiu
- Leah De Laurell
- Connor Doyle
- Jimmy Eckstein
- Josh Kaplan
- Phillip Lee
- Jake Ursetta
