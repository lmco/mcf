# Changelog
All notable changes to this project will be documented in this file.

## [0.8.0] - 2019-04-09
### Major Features and Improvements
* Updated UI pages for organization, project, user, and elements
* Added ability for user to change their own password if they are a local user
* Updated element tree display
* Added edit function for organization, project, user, and elements
* Added side panels for element information view
* Added element add and delete capabilities
* Updated some of the styles through out the UI (i.e. the home page, sidebar, navbar, any of the org/project/profile pages)
* Added the sidebar plugin capabilities for projects
* Updated the profile page with the list of orgs or projects to be one the profile pages
* Updated the physical structure of the UI components and sass files

### Bug Fixes and Other Changes
* Added lean option to controllers to significantly improve performance
* Added basic filtering when finding elements (i.e. the ability to search for elements with specific parents, created by specific users, etc.)
* Added the ability to reference elements outside the current project (must be in the same org)
* Added CHANGEME.md
* Updated all documentation

## [0.7.3] - 2019-03-15
### Major Features and Improvements
* Added the minified option to all API endpoints
* Added the skip option to all find() functions and GET endpoints
* Renamed the jmiOpt option to format
* Added the events.js library and emitting events on create/update/delete of orgs/projects/elements/users

## [0.7.2] - 2019-03-13
### Major Features and Improvements
* Added createOrReplace controller functions and PUT endpoints for all object types
* Added the fields options to all controller functions (excluding remove())
* Added the limit option to all find() functions
* Added the element search controller function and API endpoint
* Created an additional test suite to test for expected errors

### Bug Fixes and Other Changes
* Added CREDITS file

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
