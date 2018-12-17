// OrgController

OrgController.find(reqUser); // Find all orgs a user has access to
OrgController.find(reqUser, {options}); // Find all orgs a user has access to with options
OrgController.find(reqUser, ['org1', 'org2', ...], {options}); // Find orgs from an array of ids
OrgController.find(reqUser, 'org1', {options}); // Find a single org by ID

OrgController.create(reqUser, [{Org1}, {Org2}, ...], {options}); // Create multiple orgs from array
OrgController.create(reqUser, {Org}, {options}); // Create a single org

// Update each field provided in object
// Move permissions changes to update
// If passing in an array, concat that array to the existing array
// TODO: Investigate if virtuals work when the value is mixed, rather than an array
OrgController.update(reqUser, [{Org1, Org2}, ...], {options}); // Update// multiple objects
OrgController.update(reqUser, {Org1}, {options}); // Update a single org object

OrgController.delete(reqUser); // Delete all orgs a user has access to
OrgController.delete(reqUser, {options}); // Delete all orgs a user has access to with options
OrgController.delete(reqUser, ['org1', 'org2', ...], {options}); // Delete orgs from an array of ids
OrgController.delete(reqUser, 'org1', {options}); // Delete a single org by ID

// TODO: What will PUT map to?
OrgController.replace() or OrgController.createOrReplace()


// ProjectController:





// Extra Notes

/**
 * To handle removing fields from custom data or other mixed data, currently the
 * process would be to (1) GET the object's custom data, (2) delete fields from
 * local copy of custom data, (3) PATCH the object to set custom data to null/{},
 * (4) PATCH the object to reset the custom data and remove the desired fields.
 */
