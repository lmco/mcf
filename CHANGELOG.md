# Changelog
All notable changes to this project will be documented in this file.

## [0.8.0] - 2019-04-09
### Major Features and Improvements
* Changes example
### Behavioral changes
* Changes example
### Bug Fixes and Other Changes
* Added CREDITS file

## [0.7.3] - 2019-03-15
### Major Features and Improvements
* Changes example
### Behavioral changes
* Changes example
### Bug Fixes and Other Changes
* Changes example

## [0.7.2] - 2019-03-13
### Major Features and Improvements
* Changes example
### Behavioral changes
* Changes example
### Bug Fixes and Other Changes
* Changes example


## [0.7.1] - 2019-02-20
### Major Features and Improvements
* Refactored logical controller layer to focus on backwards compatibility of APIs (JavaScript and HTTP)
* Adds new API endpoint for updating user passwords
* Integration of front-end UI framework to support future UI development
* Provides basic support for Docker
* Provides a default configuration file
* Improved dependency management for plugins

### Bug Fixes and Other Changes
* Removed all remaining marvel references from tests
* Deleted the utils.assertAdmin() function as it was only being used in tests
* Deleted helper function in 600 tests that was already written in the test-utils file.
* Permissions logic was incorrect for Element.find(), Element.update(), Element.create(), Project.create(), Project.update() and Org.update(). If the user was a system-wide admin, but not part of the org/project, they were unable to perform the operation.
* Concatenated project ID was being displayed in some error messages.

## [0.7.0] - 2019-02-25
### Major Features and Improvements
* Added API Controller backwards compatibility
* Introduces database schema migration scripts to ease schema changes in future releases
* Adds MBEE Flight Manual (user manual) to provide a single source of documentation

### Bug Fixes and Other Changes
* Updated the licenses and copyrights in all of the files.
* Added @owner tags to all files. Created a 0.6.0.1 -> 0.7.0 migration script.
* Updated some of the JSDoc to be properly formatted.

## [0.6.0] - 2018-12-05
### Major Features and Improvements
* Initial public release
