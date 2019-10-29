/**
 * @classification UNCLASSIFIED
 *
 * @module db.dynamodb-strategy
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license MIT
 *
 * @owner Austin Bieber
 *
 * @author Austin Bieber
 *
 * @description This file defines the schema strategy for using MBEE with the
 * database DynamoDB.
 */

// NPM modules
const AWS = require('aws-sdk');
const DynamoDBStore = require('dynamodb-store');

// MBEE modules
const errors = M.require('lib.errors');
const utils = M.require('lib.utils');

// Define a function wide variable models, which stores each model
const models = {};

/**
 * @description Creates the connection to the DynamoDB instance.
 *
 * @returns {Promise<object>} The DynamoDB connection object.
 */
async function connect() {
  return new Promise((resolve, reject) => {
    // Create database connection
    const dynamoDB = new AWS.DynamoDB({
      apiVersion: '2012-08-10',
      endpoint: `${M.config.db.url}:${M.config.db.port}`,
      accessKeyId: M.config.db.accessKeyId,
      secretAccessKey: M.config.db.secretAccessKey,
      region: M.config.db.region
    });

    // Return the database connection
    return resolve(dynamoDB);
  });
}

/**
 * @description Disconnects from the database. This function is not necessary
 * for DynamoDB.
 *
 * @returns {Promise} Resolves every time.
 */
function disconnect() {
  return new Promise((resolve) => resolve());
}

/**
 * @description Deletes all tables and the documents in them from the database.
 * @async
 *
 * @returns {Promise} Resolves upon completion.
 */
async function clear() {
  try {
    // Create the connection to the database
    const conn = await connect();
    // List all of the tables in the database
    const tables = await conn.listTables({}).promise();

    const promises = [];
    // For each existing table
    tables.TableNames.forEach((table) => {
      // Delete the table
      promises.push(conn.deleteTable({ TableName: table }).promise());
    });

    // Wait for all promises to complete
    await Promise.all(promises);
  }
  catch (error) {
    throw errors.captureError(error);
  }
}

// TODO: Figure out if any data needs to be sanitized
/**
 * @description Sanitizes the data to protect against database injections or
 * unauthorized access to data.
 *
 * @param {*} data - The data to be sanitized.
 *
 * @returns {*} The sanitized data.
 */
function sanitize(data) {
  return data;
}

class Schema {

  /**
   * @description The Schema constructor. Accepts a definition object and
   * options, and converts to definition into a DynamoDB friendly schema. Stores
   * hooks, methods, statics and fields that can be populated on the definition.
   *
   * @param {object} definition - The schema definition object. Specifies fields
   * which can be defined on a document, indexes on those fields, validators
   * and other properties on each field.
   * @param {object} options - An object containing schema options.
   */
  constructor(definition, options) {
    // Define the main schema. The _id field is the unique identifier of each
    // document, and therefore is included in the KeySchema
    this.schema = {
      AttributeDefinitions: [{
        AttributeName: '_id',
        AttributeType: 'S'
      }],
      KeySchema: [{
        AttributeName: '_id',
        KeyType: 'HASH'
      }],
      GlobalSecondaryIndexes: []
    };

    // Define the definition and populate object
    this.definition = definition;
    this.definition.populate = {};
    this.add(definition);

    // Define the definition hooks, methods and statics
    this.definition.hooks = { pre: [], post: [] };
    this.definition.methods = [];
    this.definition.statics = [];

    // Remove GlobalSecondaryIndex array if empty, meaning there are no additional indexes
    if (this.schema.GlobalSecondaryIndexes.length === 0) {
      delete this.schema.GlobalSecondaryIndexes;
    }
  }

  /**
   * @description Adds an object/schema to the current schema.
   *
   * @param {(object|Schema)} obj - The object or schema to add to the current
   * schema.
   * @param {string} [prefix] - The optional prefix to add to the paths in obj.
   */
  add(obj, prefix) {
    // For each field defined in the object
    Object.keys(obj).forEach((key) => {
      // If the field has not already been added to the definition, add it
      if (!this.definition.hasOwnProperty(key)) {
        this.definition[key] = obj[key];
      }

      // Set the correct DynamoDB type based on the type provided
      switch (obj[key].type) {
        case 'S':
        case 'String': this.definition[key].type = 'S'; break;
        case 'N':
        case 'Number': this.definition[key].type = 'N'; break;
        case 'M':
        case 'Object': this.definition[key].type = 'M'; break;
        case 'Date': this.definition[key].type = 'N'; break;
        case 'BOOL':
        case 'Boolean': this.definition[key].type = 'BOOL'; break;
        // Default type is a string
        default: this.definition[key].type = 'S';
      }

      // If the field has an index defined
      if (obj[key].index) {
        // Create attribute object
        const attributeObj = {
          AttributeName: key,
          AttributeType: obj[key].type
        };
        // Add the the schema AttributeDefinitions
        this.schema.AttributeDefinitions.push(attributeObj);

        // Create index object
        const indexObj = {
          IndexName: `${key}_1`,
          KeySchema: [
            {
              AttributeName: key,
              KeyType: (obj[key].type === 'S') ? 'HASH' : 'RANGE'
            }
          ],
          Projection: {
            NonKeyAttributes: ['_id'],
            ProjectionType: 'INCLUDE'
          }
        };
        // Add to the schema GlobalSecondaryIndexes
        this.schema.GlobalSecondaryIndexes.push(indexObj);
      }

      // If the field references a document in another model
      if (obj[key].ref) {
        // Add reference object to the schema populate object
        this.definition.populate[key] = {
          ref: obj[key].ref,
          localField: key,
          foreignField: '_id',
          justOne: true
        };
      }
    });
  }

  /**
   * @description Registers a plugin for the schema.
   *
   * @param {Function} cb - A callback function to run.
   * @param {object} [options] - A object containing options.
   */
  plugin(cb, options) {
    this.cb = cb;
    // Call the plugin with, passing in "this" as the only parameter
    this.cb(this);
    // Remove the plugin from this
    delete this.cb;
  }

  /**
   * @description Defines an index for the schema. Can support adding compound
   * or text indexes.
   *
   * @param {object} fields - A object containing the key/values pairs where the
   * keys are the fields to add indexes to, and the values define the index type
   * where 1 defines an ascending index, -1 a descending index, and 'text'
   * defines a text index.
   * @param {object} [options] - An object containing options.
   */
  // TODO
  index(fields, options) {
    // return super.index(fields, options);
  }

  /**
   * @description Defines a function to be run prior to a certain event
   * occurring.
   *
   * @param {(string|RegExp)} methodName - The event to run the callback
   * function before.
   * @param {object} [options] - An object containing options.
   * @param {Function} cb - The callback function to run prior to the event
   * occurring.
   */
  pre(methodName, options, cb) {
    const obj = {};
    // No options provided
    if (typeof options === 'function') {
      cb = options; // eslint-disable-line no-param-reassign
    }

    // Add the pre-hook to the hooks object
    obj[methodName] = cb;
    this.definition.hooks.pre.push(obj);
  }

  /**
   * @description Defines a virtual field for the schema. Virtuals are not
   * stored in the database and rather are calculated post-find. Virtuals
   * generally will require a second request to retrieve referenced documents.
   * Populated virtuals contains a localField and foreignField which must match
   * for a document to be added to the virtual collection. For example, the
   * organization schema contains a virtual called "projects". This virtual
   * returns all projects who "org" field matches the organization's "_id".
   *
   * @param {string} name - The name of the field to be added to the schema
   * post-find.
   * @param {object} [options] - An object containing options.
   * @param {(string|Model)} [options.ref] - The name of the model which the
   * virtual references.
   * @param {(string|Function)} [options.localField] - The field on the current
   * schema which is being used to match the foreignField.
   * @param {(string|Function)} [options.foreignField] - The field on the
   * referenced schema which is being used to match the localField.
   * @param {(boolean|Function)} [options.justOne] - If true, the virtual should
   * only return a single document. If false, the virtual will be an array of
   * documents.
   */
  virtual(name, options) {
    // Add virtual to populate object
    this.definition.populate[name] = options;
    // Remove default, it's not needed
    delete this.definition.populate[name].default;
  }


  /**
   * @description Adds a static method to the schema. This method should later
   * be an accessible static method on the model.
   *
   * @param {string} name - The name of the static function.
   * @param {Function} fn - The function to be added to the model.
   */
  static(name, fn) {
    const obj = {};
    obj[name] = fn;
    // Add the static function onto the schema statics array
    this.definition.statics.push(obj);
  }

  /**
   * @description Adds a non-static method to the schema, which later will be an
   * instance method on the model.
   *
   * @param {string} name - The name of the non-static function.
   * @param {Function} fn - The function to be added to the model.
   */
  method(name, fn) {
    const obj = {};
    obj[name] = fn;
    // Add the method onto the schema methods array
    this.definition.methods.push(obj);
  }

}

/**
 * @description Defines the Model class. Models are used to create documents and
 * to directly manipulate the database. Operations should be defined to perform
 * all basic CRUD operations on the database. The Model class requirements are
 * closely based on the Mongoose.js Model class
 * {@link https://mongoosejs.com/docs/api/model.html} with a few important
 * exceptions. (1) The constructor creates an instance of the model, not a
 * document. (2) The createDocument method is used to create an actual
 * document. (3) The insertMany option "rawResult" is replaced with "lean".
 */
class Model {

  /**
   * @description Class constructor. Sets class variables, defines indexes and
   * adds the class static methods defined in the Schema onto the Model class.
   *
   * @param {string} name - The name of the model being created. This name is
   * used to create the collection name in the database.
   * @param {Schema} schema - The schema which is being turned into a model.
   * Should be an instance of the Schema class.
   * @param {string} [collection] - Optional name of the collection in the
   * database, if not provided the name should be used.
   */
  constructor(name, schema, collection) {
    this.schema = schema.schema;
    this.definition = schema.definition;
    this.TableName = collection;
    this.modelName = name;

    // Create a list of indexed fields on the schema, splitting off the _1
    this.indexes = (schema.schema.GlobalSecondaryIndexes) ? schema.schema.GlobalSecondaryIndexes
    .map(i => i.IndexName.substr(0, i.IndexName.length - 2)) : [];
    this.indexes.push('_id');

    // Add on statics
    if (Array.isArray(this.definition.statics)) {
      // For each static defined
      this.definition.statics.forEach((method) => {
        // Add method to the Model class
        this[Object.keys(method)[0]] = Object.values(method)[0]; // eslint-disable-line
      });
    }
  }

  /**
   * @description Creates a table if it does not already exist in the database.
   * @async
   */
  async init() {
    // Create connection to the database
    this.connection = await connect();
    // Grab all existing tables
    const tables = await this.listTables();
    // If the table does not currently exist
    if (!tables.TableNames.includes(this.TableName)) {
      // Set the TableName and BillingMode
      this.schema.TableName = this.TableName;
      this.schema.BillingMode = 'PAY_PER_REQUEST';

      M.log.debug(`DB OPERATION: ${this.TableName} createTable`);
      // Create the actual table
      await this.connection.createTable(this.schema).promise();
    }
    else {
      // TODO: We should update the table in case fields/indexes have been added
    }

    // Add the model to the file-wide model object
    // This is used later for population
    models[this.modelName] = this;
  }

  /**
   * @description Finds and returns an object containing a list of existing
   * table's names in the database. See the
   * {@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB.html#listTables-property listTables}
   * documentation for more information.
   *
   * @returns {Promise<object>} An object containing table names. The single key
   * in the object is TableNames and the value is an array of strings.
   */
  async listTables() {
    try {
      M.log.debug('DB OPERATION: listTables');
      // Find all tables
      return this.connection.listTables({}).promise();
    }
    catch (error) {
      M.log.verbose(`Failed to ${this.modelName}.findTables().`);
      throw errors.captureError(error);
    }
  }

  /**
   * @description Formats documents to return them in the proper format
   * expected in controllers.
   * @async
   *
   * @param {object[]} documents -  The documents to properly format.
   * @param {object} options - The options supplied to the function.
   *
   * @returns {object[]} - An array of properly formatted documents.
   */
  async formatDocuments(documents, options) {
    // Loop through each document
    const promises = [];
    for (let i = 0; i < documents.length; i++) {
      promises.push(this.formatDocument(documents[i], options)
      .then((doc) => {
        documents[i] = doc;
      }));
    }

    // Wait for all promises to complete
    await Promise.all(promises);

    // Return modified documents
    return documents;
  }

  /**
   * @description Formats a single document and returns it in the proper format
   * expected in the controllers.
   * @async
   *
   * @param {object} document -  The documents to properly format.
   * @param {object} [options={}] - The options supplied to the function.
   * @param {boolean} [recurse=false] - A boolean value which if true, specifies
   * that this function was called recursively.
   *
   * @returns {object} - The properly formatted document.
   */
  async formatDocument(document, options = {}, recurse = false) {
    const promises = [];
    // For each field in the document
    Object.keys(document).forEach((field) => {
      // If the string null, convert to actual value. The value null is allowed
      // in MBEE for strings, but not supported in DynamoDB on a string field
      if (Object.values(document[field])[0] === 'null') {
        document[field][Object.keys(document[field])[0]] = null;
      }

      // If the field type is 'M', meaning a JSON object/map
      if (Object.keys(document[field])[0] === 'M') {
        // Recursively call this function with the field contents and no options
        promises.push(this.formatDocument(document[field].M, {}, true)
        .then((retDoc) => {
          document[field] = retDoc;
        }));
      }
      // If the field type is 'N', meaning a number and its not null
      else if (Object.keys(document[field])[0] === 'N'
        && Object.values(document[field])[0] !== null) {
        // Convert the field to a Number, and remove the type
        document[field] = Number(Object.values(document[field])[0]);
      }
      else {
        // Remove the type from the value, ex: hello: { S: 'world' } --> hello: 'world'
        document[field] = Object.values(document[field])[0];
      }

      // Handle the special case where the type is a string, it defaults to null,
      // and the value in the database is the string null. This was done to work
      // around the existence of a NULL type in DynamoDB
      // TODO: is this still needed? We have a similar case above
      if (this.definition[field]
        && this.definition[field].hasOwnProperty('default')
        && this.definition[field].default === null
        && this.definition[field].type === 'S'
        && document[field] === 'null') {
        // Set value equal to null
        document[field] = null;
      }
    });

    // Wait for any recursive portions to complete
    await Promise.all(promises);

    // If the top level, and not a recursive call of this function
    if (!recurse) {
      // Loop through all keys in definition
      Object.keys(this.definition).forEach((k) => {
        // If the key is not in the document
        if (!document.hasOwnProperty(k)) {
          // If the key has a default, set it
          if (this.definition[k].hasOwnProperty('default')) {
            document[k] = this.definition[k].default;
          }
        }
      });

      // Populate any fields specified in the options object
      await this.populate(document, options);

      // If the lean option is NOT supplied, add on document functions
      if (!options.lean) {
        document = this.createDocument(document); // eslint-disable-line no-param-reassign
      }
    }

    return document;
  }

  /**
   * @description Finds multiple documents from the database. Each field
   * specified in the filter MUST be indexed. See the
   * {@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB.html#batchGetItem-property batchGetItem}
   * documentation for more information.
   *
   * @param {object} filter - The query to parse and send.
   * @param {string|null} projection - A space separated string of fields to return
   * from the database.
   * @param {object} options - An object containing valid options.
   *
   * @returns {Promise<object[]>} - An array of found documents.
   */
  async batchGetItem(filter, projection, options) {
    try {
      // Create the new query object
      const query = new Query(this, projection, options);
      // Get an array of properly formatted batchGetItem queries
      const queriesToMake = query.batchGetItem(filter);

      let foundDocs = [];
      const promises = [];
      // For each query
      queriesToMake.forEach((q) => {
        // Log the database operation
        M.log.debug(`DB OPERATION: ${this.TableName} batchGetItem`);
        // Append operation to promises array
        promises.push(
          // Connect to the database
          connect()
          // Make the batchGetItem request
          .then((conn) => conn.batchGetItem(q).promise())
          .then((found) => {
            // Append the found documents to the function-global array
            foundDocs = foundDocs.concat(found.Responses[this.TableName]);
          })
        );
      });

      // Wait for completion of all promises
      await Promise.all(promises);

      // Return the properly formatted documents
      return await this.formatDocuments(foundDocs, options);
    }
    catch (error) {
      // Log failure of the function and return and throw an MBEE CustomError
      M.log.verbose(`Failed in ${this.modelName}.batchGetItem().`);
      throw errors.captureError(error);
    }
  }

  /**
   * @description Performs a large write operation on a collection. Can create,
   * update, or delete multiple documents.
   * @async
   *
   * @param {object[]} ops - An array of objects detailing what operations to
   * perform the data required for those operations.
   * @param {object} [ops.insertOne] - Specified an insertOne operation.
   * @param {object} [ops.insertOne.document] - The document to create, for
   * insertOne.
   * @param {object} [ops.updateOne] - Specifies an updateOne operation.
   * @param {object} [ops.updateOne.filter] - An object containing parameters to
   * filter the find query by, for updateOne.
   * @param {object} [ops.updateOne.update] - An object containing updates to
   * the matched document from the updateOne filter.
   * @param {object} [ops.deleteOne] - Specifies a deleteOne operation.
   * @param {object} [ops.deleteOne.filter] - An object containing parameters to
   * filter the find query by, for deleteOne.
   * @param {object} [ops.deleteMany] - Specifies a deleteMany operation.
   * @param {object} [ops.deleteMany.filter] - An object containing parameters
   * to filter the find query by, for deleteMany.
   * @param {object} [options] - An object containing options.
   * @param {Function} [cb] - A callback function to run.
   *
   * @example
   * await bulkWrite([
   *   {
   *     insertOne: {
   *       document: {
   *         name: 'Sample Name',
   *       }
   *     }
   *   },
   *   {
   *     updateOne: {
   *       filter: { _id: 'sample-id' },
   *       update: { name: 'Sample Name Updated' }
   *     }
   *   },
   *   {
   *     deleteOne: {
   *       filter: { _id: 'sample-id-to-delete' }
   *     }
   *   }
   * ]);
   */
  async bulkWrite(ops, options, cb) {
    const promises = [];

    // For each operation in the ops array
    ops.forEach((op) => {
      // If it is an updateOne operation
      if (Object.keys(op)[0] === 'updateOne') {
        // Grab the filter and update object
        const filter = Object.values(op)[0].filter;
        const update = Object.values(op)[0].update;

        // Perform the updateOne operation
        promises.push(this.updateOne(filter, update, options));
      }
      // TODO: Handle insertOne
      // TODO: Handle deleteOne
      // TODO: Handle deleteMany
    });

    // Wait for promises to complete
    await Promise.all(promises);
  }

  /**
   * @description Creates a document based on the model's schema. Sets defaults
   * if the schema definition has a default defined for the field, and the field
   * is not set. Defines the prototype functions validateSync, save, remove,
   * markModified (which is unused) and hooks/methods defined by the schema
   * definition.
   *
   * @param {object} doc - The JSON to be converted into a document. Should
   * roughly align with the model's schema. Each document created should at
   * least contain an _id, as well as the methods defined in the schema.
   *
   * @returns {object} The document object.
   */
  createDocument(doc) {
    // Create a copy of the JSON
    doc = JSON.parse(JSON.stringify(doc)); // eslint-disable-line no-param-reassign
    // Reset the prototypes
    doc.__proto__ = {}; // eslint-disable-line no-proto
    const def = this.definition;
    const table = this.TableName;
    const modelName = this.modelName;
    const model = this;

    // Set defaults
    Object.keys(def).forEach((param) => {
      // If a default exists and the value isn't set
      if (def[param].default && !Object.keys(doc).includes(param)) {
        // If the default is a function, call it
        if (typeof def[param].default === 'function') {
          doc[param] = def[param].default();
        }
        else {
          // Set the value equal to th default
          doc[param] = def[param].default;
        }
      }
    });

    /**
     * @description Synchronously validates a document. Runs validator
     * functions, validates the type, sets defaults if no value is provided, and
     * if the field is required and no default is provided, and error is thrown.
     *
     * @param {string[]|string|undefined} fields - The fields to validate on the
     * document. Can either be an array of string, a single string, or
     * undefined. If undefined, all fields defined in the Schema are validated.
     *
     * @throws {DataFormatError}
     */
    doc.__proto__.validateSync = function(fields) { // eslint-disable-line no-proto
      let keys;
      // If fields is provided and is an array, set equal to keys
      if (Array.isArray(fields)) {
        keys = fields;
      }
      // If only a single field is provided, add to array
      else if (typeof fields === 'string') {
        keys = [fields];
      }
      // Validate every key in the document
      else {
        keys = Object.keys(doc);
      }

      // Loop over each valid parameter in the definition
      Object.keys(def).forEach((param) => {
        // If a default exists and the value isn't set, and no specific fields are provided
        if (def[param].hasOwnProperty('default') && !keys.includes(param) && !fields) {
          // If the default is a function, call it
          if (typeof def[param].default === 'function') {
            doc[param] = def[param].default();
          }
          else if (def[param].default === '') {
            // Do nothing, empty strings cannot be saved in DynamoDB
          }
          else {
            // Set the value equal to the default
            doc[param] = def[param].default;
          }
        }

        // Parameter was defined on the document
        if (keys.includes(param)) {
          // Validate type
          let shouldBeType;
          switch (def[param].type) {
            case 'S':
              shouldBeType = 'string'; break;
            case 'N':
              shouldBeType = 'number'; break;
            case 'M':
              shouldBeType = 'object'; break;
            case 'BOOL':
              shouldBeType = 'boolean'; break;
            default:
              throw new M.DataFormatError(`Invalid DynamoDB type: ${def[param].type}`);
          }

          // If validators are defined on the field
          if (def[param].hasOwnProperty('validate')) {
            // For each validator defined
            def[param].validate.forEach((v) => {
              // Call the validator, binding the document to "this"
              if (!v.validator.call(doc, doc[param])) {
                // If the validator fails, throw an error
                throw new M.DataFormatError(`${modelName} validation failed: `
                + `${param}: ${v.message({ value: doc[param] })}`);
              }
            });
          }

          // If not the correct type, throw an error
          if (typeof doc[param] !== shouldBeType // eslint-disable-line valid-typeof
            && !(shouldBeType !== 'object' && doc[param] === null)) {
            throw new M.DataFormatError(`${modelName} validation failed: `
              + `${param}: Cast to ${utils.toTitleCase(shouldBeType)} failed `
              + `for value "${JSON.stringify(doc[param])}" at path "${param}"`);
          }

          // If an array of enums exists, and the value is not in it, throw an error
          if (def[param].hasOwnProperty('enum') && !def[param].enum.includes(doc[param])) {
            throw new M.DataFormatError(`${modelName} validation failed: `
              + `${param}: \`${doc[param]}\` is not a valid enum value for path`
              + ` \`${param}\`.`);
          }

          // Handle special case where the field should be a string, and defaults to null
          if (def[param].hasOwnProperty('default')
            && def[param].default === null && doc[param] === null) {
            // The string null is a reserved keyword for string fields with null defaults
            if (doc[param] === 'null') {
              throw new M.DataFormatError('The string \'null\' is a reserved '
                + `keyword for the parameter [${param}].`);
            }
            // Set the value to the string null
            else {
              doc[param] = 'null';
            }
          }

          // If value is a blank string, delete key; blank strings are not allowed in DynamoDB
          if (doc[param] === '') delete doc[param];
        }
        // If the parameter is required and no default is provided, throw an error
        else if (def[param].required && !def[param].default) {
          let message = `Path \`${param}\` is required.`;
          // If required is an array, grab the error message (second entry)
          if (Array.isArray(def[param].required) && def[param].required.length === 2) {
            message = def[param].required[1];
          }
          throw new M.DataFormatError(`${modelName} validation failed: `
            + `${param}: ${message}`);
        }
      });
    };

    /**
     * @description Validates and saves a document to the database.
     * @async
     *
     * @returns {Promise<object>} The saved document.
     */
    doc.__proto__.save = async function() { // eslint-disable-line no-proto
      try {
        // Ensure the document is valid
        this.validateSync();
        const promises = [];
        // If pre-save hooks exist, call them
        if ('presave' in this) {
          promises.push(this.presave());
        }

        // Wait for any pre-save promises to resolve
        await Promise.all(promises);

        // Connect to the database
        const conn = await connect();

        const putObj = {
          TableName: table,
          Item: {}
        };
        // Format the document object
        putObj.Item = model.formatObject(this);

        M.log.debug(`DB OPERATION: ${table} putItem`);
        // Save the document
        await conn.putItem(putObj).promise();
        // Find and return the saved document
        return await model.findOne({ _id: doc._id });
      }
      catch (error) {
        M.log.verbose(`Failed in ${modelName}.doc.save().`);
        throw errors.captureError(error);
      }
    };

    /**
     * @description Deletes the document from the database.
     * @async
     *
     * @returns {Promise} Resolves upon completion.
     */
    doc.__proto__.remove = async function() { // eslint-disable-line no-proto
      try {
        await model.deleteMany({ _id: this._id });
      }
      catch (error) {
        M.log.verbose(`Failed in ${modelName}.doc.remove().`);
        throw errors.captureError(error);
      }
    };

    /**
     * @description Unused function called when a field whose value is a JSON
     * object is modified.
     *
     * @param {string} field - The field which was modified.
     */
    doc.__proto__.markModified = function(field) {}; // eslint-disable-line no-proto

    // Add on object methods, defined in schema definition
    if (Array.isArray(def.methods)) {
      def.methods.forEach((method) => {
        doc.__proto__[Object.keys(method)[0]] = Object.values(method)[0]; // eslint-disable-line
      });
    }

    // Add on pre-hooks, defined in schema definition
    if (Array.isArray(def.hooks.pre)) {
      def.hooks.pre.forEach((hook) => {
        doc.__proto__[`pre${Object.keys(hook)[0]}`] = Object.values(hook)[0]; // eslint-disable-line
      });
    }

    // Return the document containing the prototype functions
    return doc;
  }

  /**
   * @description Counts the number of documents that matches a filter.
   * @async
   *
   * @param {object} filter - An object containing parameters to filter the
   * find query by.
   * @param {Function} [cb] - A callback function to run.
   *
   * @returns {Promise<number>} The number of documents which matched the
   * filter.
   */
  async countDocuments(filter, cb) {
    try {
      // Create a new query object
      const query = new Query(this, null, {});
      // Get a formatted scan query
      const scanObj = query.scan(filter);

      // Tell the query to only return the count
      scanObj.Select = 'COUNT';

      // Connect to the database
      const conn = await connect();

      // Perform the scan query and return the count
      M.log.debug(`DB OPERATION: ${this.TableName} countDocuments`);
      const data = await conn.scan(scanObj).promise();
      return data.Count;
    }
    catch (error) {
      M.log.verbose(`Failed in ${this.modelName}.countDocuments().`);
      throw errors.captureError(error);
    }
  }

  /**
   * @description Deletes the specified index from the database.
   * @async
   *
   * @param {string} name - The name of the index.
   */
  // TODO
  async deleteIndex(name) {
    // return super.deleteIndex(name);
  }

  /**
   * @description Deletes any documents that match the provided conditions.
   * @async
   *
   * @param {object} conditions - An object containing parameters to filter the
   * find query by, and thus delete documents by.
   * @param {object} [options] - An object containing options.
   * @param {Function} [cb] - A callback function to run.
   *
   * @returns {Promise<object>} An object denoting the success of the delete
   * operation.
   */
  async deleteMany(conditions, options, cb) {
    try {
      let docs = [];
      let more = true;

      // Find all documents which match the provided conditions
      while (more) {
        // Find the max number of documents
        const result = await this.scan(conditions, null, options); // eslint-disable-line
        docs = docs.concat(result.Items);

        // If there are no more documents to find, exit loop
        if (!result.LastEvaluatedKey) {
          more = false;
        }
        else {
          // Set LastEvaluatedKey, used to paginate
          options.LastEvaluatedKey = result.LastEvaluatedKey;
        }
      }

      // Format the documents
      docs = await this.formatDocuments(docs, options);

      // Create a query containing all ids to delete
      const tmpQuery = { _id: { $in: docs.map(d => d._id) } };

      // Create a new query object
      const query = new Query(this, null, options);
      // Get the formatted batchWriteItem query, used for deletion
      const deleteQuery = query.deleteMany(tmpQuery);

      // If there are items to delete
      if (deleteQuery.RequestItems[this.TableName].length > 0) {
        // Connect to the database
        const conn = await connect();
        // Delete the documents
        await conn.batchWriteItem(deleteQuery, options).promise();
      }

      // Return an object specifying the success of the delete operation
      return { n: tmpQuery._id.$in.length, ok: 1 };
    }
    catch (error) {
      M.log.verbose(`Failed in ${this.modelName}.deleteMany().`);
      throw errors.captureError(error);
    }
  }

  /**
   * @description Finds multiple documents based on the filter provided.
   * @async
   *
   * @param {object} filter - An object containing parameters to filter the
   * find query by.
   * @param {(object|string)} [projection] - Specifies the fields to return in
   * the documents that match the filter. To return all fields, omit this
   * parameter.
   * @param {object} [options] - An object containing options.
   * @param {object} [options.sort] - An object specifying the order by which
   * to sort and return the documents. Keys are fields by which to sort, and
   * values are the sort order where 1 is ascending and -1 is descending. It is
   * possible to sort by metadata by providing the key $meta and a non-numerical
   * value. This is used primarily for text based search.
   * @param {number} [options.limit] - Limits the number of documents returned.
   * A limit of 0 is equivalent to setting no limit and a negative limit is not
   * supported.
   * @param {number} [options.skip] - Skips a specified number of documents that
   * matched the query. Given 10 documents match with a skip of 5, only the
   * final 5 documents would be returned. A skip value of 0 is equivalent to not
   * skipping any documents. A negative skip value is not supported.
   * @param {string} [options.populate] - A space separated list of fields to
   * populate of return of a document. Only fields that reference other
   * documents can be populated. Populating a field returns the entire
   * referenced document instead of that document's ID. If no document exists,
   * null is returned.
   * @param {boolean} [options.lean] - If false (by default), every document
   * returned will contain methods that were declared in the Schema. If true,
   * just the raw JSON will be returned from the database.
   * @param {Function} [cb] - A callback function to run.
   *
   * @returns {Promise<object[]>} An array containing the found documents, if
   * any. Defaults to an empty array if no documents are found.
   */
  async find(filter, projection, options, cb) {
    try {
      // Use batchGetItem only iff the only parameter being searched is the _id
      if (Object.keys(filter).length === 1 && Object.keys(filter)[0] === '_id') {
        return await this.batchGetItem(filter, projection, options);
      }
      else {
        let docs = [];
        let more = true;

        // Find all documents which match the query
        while (more) {
          // Find the max number of documents
          const result = await this.scan(filter, null, options); // eslint-disable-line

          // If there are no more documents to find, exit loop
          if (!result.LastEvaluatedKey) {
            more = false;
          }
          // If ONLY the option limit is provided and not skip
          else if (options.limit && !options.skip) {
            // The correct number of documents has been found
            if (docs.length + result.Items.length === options.limit) {
              more = false;
            }
            // Too many docs found, should never happen
            else if (docs.length + result.Items.length > options.limit) {
              throw new M.ServerError('Too many documents found using limit option.');
            }
            // Still not enough documents found, reduce options.limit and et LastEvaluatedKey
            else {
              options.LastEvaluatedKey = result.LastEvaluatedKey;
              options.limit -= result.Items.length;
            }
          }
          // Still more documents to be found
          else {
            // Set LastEvaluatedKey, used to paginate
            options.LastEvaluatedKey = result.LastEvaluatedKey;
          }

          // Append found documents to the running array
          docs = docs.concat(result.Items);
        }

        // Format and return the documents
        return await this.formatDocuments(docs, options);
      }
    }
    catch (error) {
      M.log.verbose(`Failed in ${this.modelName}.find().`);
      throw errors.captureError(error);
    }
  }

  /**
   * @description Finds a single document based on the filter provided.
   * @async
   *
   * @param {object} conditions - An object containing parameters to filter the
   * find query by.
   * @param {(object|string)} [projection] - Specifies the fields to return in
   * the document that matches the filter. To return all fields, omit this
   * parameter.
   * @param {object} [options] - An object containing options.
   * @param {string} [options.populate] - A space separated list of fields to
   * populate of return of a document. Only fields that reference other
   * documents can be populated. Populating a field returns the entire
   * referenced document instead of that document's ID. If no document exists,
   * null is returned.
   * @param {boolean} [options.lean] - If false (by default), every document
   * returned will contain methods that were declared in the Schema. If true,
   * just the raw JSON will be returned from the database.
   * @param {Function} [cb] - A callback function to run.
   *
   * @returns {Promise<object|null>} The found document, if any. Returns null if
   * no document is found.
   */
  async findOne(conditions, projection, options, cb) {
    try {
      let allIndexed = true;
      // Loop through each field in the conditions object
      Object.keys(conditions).forEach((key) => {
        // If the field is not indexed, set allIndexed to false
        if ((!this.definition[key].hasOwnProperty('index')
          || this.definition[key].index === false)
          && key !== '_id') {
          allIndexed = false;
        }
      });

      // If all fields are indexed, use getItem
      if (allIndexed) {
        // Create a new query object
        const query = new Query(this, projection, options);
        // Get a formatted getItem query
        const getObj = query.getItem(conditions);

        // Connect to the database
        const conn = await connect();

        // Make the getItem request
        M.log.debug(`DB OPERATION: ${this.TableName} getItem`);
        const result = await conn.getItem(getObj).promise();

        // If no document is found, return null
        if (Object.keys(result).length === 0) {
          return null;
        }
        else {
          // Return the document
          return await this.formatDocument(result.Item, options);
        }
      }
      // Not all fields have indexes, use scan to find the document
      else {
        // Find the document
        const result = await this.scan(conditions, projection, options);
        // If there were documents found, return the first one
        if (Array.isArray(result.Items) && result.Items.length !== 0) {
          return await this.formatDocument(result.Items[0]);
        }
        // No document found, return null
        else {
          return null;
        }
      }
    }
    catch (error) {
      M.log.verbose(`Failed in ${this.modelName}.findOne().`);
      throw errors.captureError(error);
    }
  }

  /**
   * @description Returns an array of indexes for the given model. See the
   * {@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB.html#deleteTable-property describeTable}
   * documentation for more information.
   * @async
   *
   * @returns {Promise<object[]>} Array of index objects.
   */
  // TODO: We might have to include the GlobalSecondaryIndexes in here
  async getIndexes() {
    try {
      // Connect to the database
      const conn = await connect();

      // Get the table information, which includes indexes
      M.log.debug(`DB OPERATION: ${this.TableName} describeTable`);
      const table = await conn.describeTable({ TableName: this.TableName }).promise();
      // Return the index info
      return table.Table.KeySchema;
    }
    catch (error) {
      M.log.error(`Failed in ${this.modelName}.getIndexes().`);
      throw errors.captureError(error);
    }
  }

  /**
   * @description Inserts any number of documents into the database.
   * @async
   *
   * @param {object[]} docs - An array of documents to insert.
   * @param {object} [options] - An object containing options.
   * @param {boolean} [options.lean] - If false (by default), every document
   * returned will contain methods that were declared in the Schema. If true,
   * just the raw JSON will be returned from the database.
   * @param {boolean} [options.skipValidation] - If true, will not validate
   * the documents which are being created.
   * @param {Function} [cb] - A callback function to run.
   *
   * @returns {Promise<object[]>} The created documents.
   */
  async insertMany(docs, options, cb) {
    try {
      // Create a query, searching for existing documents by _id
      const query = { _id: { $in: docs.map(d => d._id) } };
      // Attempt to find any existing documents
      const conflictingDocs = await this.batchGetItem(query, null, options);

      // If documents with matching _ids exist, throw an error
      if (conflictingDocs.length > 0) {
        throw new M.PermissionError('Documents with the following _ids already'
          + `exist: ${conflictingDocs.map(d => utils.parseID(d._id).pop())}.`, 'warn');
      }
      else {
        const promises2 = [];
        // Format and validate documents
        const formattedDocs = docs.map(d => this.createDocument(d));
        formattedDocs.forEach(d => d.validateSync());

        // Connect to the database
        const conn = await connect();

        // TODO: Improve the batchWriteItem code by adding a Query function
        // Loop through all docs in batches of 25
        for (let i = 0; i < formattedDocs.length / 25; i++) {
          const batch = formattedDocs.slice(i * 25, i * 25 + 25);
          const batchWriteObj = {
            RequestItems: {}
          };
          batchWriteObj.RequestItems[this.TableName] = [];
          batch.forEach((doc) => {
            const putObj = {
              PutRequest: {
                Item: {}
              }
            };

            putObj.PutRequest.Item = this.formatObject(doc);

            batchWriteObj.RequestItems[this.TableName].push(putObj);
          });

          M.log.debug(`DB OPERATION: ${this.TableName} batchWriteItem`);
          promises2.push(conn.batchWriteItem(batchWriteObj).promise());
        }

        await Promise.all(promises2);
      }

      // Find and return the newly created documents
      return await this.batchGetItem(query, null, options);
    }
    catch (error) {
      M.log.verbose(`Failed in ${this.modelName}.insertMany().`);
      throw errors.captureError(error);
    }
  }

  /**
   * @description Populates a single document with specified fields provided in
   * the options object.
   * @async
   *
   * @param {object} doc - The document to populate.
   * @param {object} options - The object containing the options.
   * @param {string} [options.populate] - A string of fields to populate,
   * separated by spaces.
   *
   * @returns {Promise<object>} The document, populated with the fields
   * specified in options.populate.
   */
  async populate(doc, options) {
    // If there are fields to populate
    if (options.populate) {
      // Get an array of the fields to populate
      const fieldsToPop = options.populate.split(' ');

      const promises = [];
      fieldsToPop.forEach((f) => {
        // Get the populate object, defined in the schema definition
        const popObj = this.definition.populate[f];

        // If the field to populate is defined
        if (popObj) {
          // If the field is null, empty string or undefined
          if (!doc[f]) {
            // Set the value to null if justOne is true, else an empty array
            doc[f] = (popObj.justOne) ? null : [];
          }
          else {
            // Create the find query
            const query = {};
            query[popObj.foreignField] = doc[popObj.localField];

            // If justOne is true, use findOne
            if (popObj.justOne) {
              promises.push(models[popObj.ref].findOne(query, null, {})
              .then((objs) => { doc[f] = objs; }));
            }
            // findOne is false, find an array of matching documents
            else {
              promises.push(models[popObj.ref].find(query, null, {})
              .then((objs) => { doc[f] = objs; }));
            }
          }
        }
      });

      // Wait for all promises to complete
      await Promise.all(promises);
    }
    return doc;
  }

  // TODO: Come back to this function, we SHOULDNT need this after making the Query class better
  /**
   * @description Formats a document or query to support DynamoDB's structure.
   *
   * @param {object} obj - The object to format.
   *
   * @returns {object} The formatted object.
   */
  formatObject(obj) {
    const returnObj = {};

    Object.keys(obj).forEach((key) => {
      switch (typeof obj[key]) {
        case 'string': returnObj[key] = { S: obj[key] }; break;
        case 'number': returnObj[key] = { N: obj[key].toString() }; break;
        case 'boolean': returnObj[key] = { BOOL: obj[key] }; break;
        case 'object': {
          // If the object is an array, call recursively
          if (Array.isArray(obj[key])) {
            // Handle an array of strings
            if (obj[key].every(v => typeof v === 'string')) {
              if (obj[key].length !== 0) {
                returnObj[key] = { SS: obj[key] };
              }
            }
            // Handle an array of numbers
            else if (obj[key].every(v => typeof v === 'number')) {
              returnObj[key] = { NS: obj[key] };
            }
            // Handle all other arrays
            else {
              returnObj[key] = { L: this.formatObject(obj[key]) };
            }
          }
          else if (obj[key] === null) {
            // TODO: Should we explicitly handle this case or not?
            // returnObj[key] = { NULL: true };
          }
          else {
            returnObj[key] = { M: this.formatObject(obj[key]) };
          }
          break;
        }
        default:
          throw new M.DataFormatError(`Unsupported type ${key}.`);
      }
    });

    return returnObj;
  }

  /**
   * @description Scans every document in the specified table, and returns the
   * documents which match the filter. This function is used to find documents
   * when not every parameter in the filter is indexed. See the
   * {@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB.html#scan-property scan}
   * documentation for more information.
   * @async
   *
   * @param {object} filter - A list of fields to query.
   * @param {string|null} projection - The specific fields to return.
   * @param {object} options - A list of provided options.
   *
   * @returns {Promise<object>} The results of the scan query.
   */
  async scan(filter, projection, options) {
    try {
      // Create a new DynamoDB query
      const query = new Query(this, projection, options);
      // Get the formatted scan query
      const scanObj = query.scan(filter);

      // Connect to the database
      const conn = await connect();

      M.log.debug(`DB OPERATION: ${this.TableName} scan`);
      // Find the documents
      return await conn.scan(scanObj).promise();
    }
    catch (error) {
      M.log.verbose(`Failed in ${this.modelName}.scan().`);
      throw errors.captureError(error);
    }
  }

  /**
   * @description Updates multiple documents matched by the filter with the same
   * changes in the provided doc.
   * @async
   *
   * @param {object} filter - An object containing parameters to filter the
   * find query by.
   * @param {object} doc - The object containing updates to the found documents.
   * @param {object} [options] - An object containing options.
   * @param {Function} [cb] - A callback function to run.
   */
  async updateMany(filter, doc, options, cb) {
    // return this.updateItem(filter, doc, options);
  }

  /**
   * @description Updates a single document which is matched by the filter, and
   * is updated with the doc provided. See the
   * {@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB.html#updateItem-property updateItem}
   * documentation for more information.
   * @async
   *
   * @param {object} filter - An object containing parameters to filter the
   * find query by.
   * @param {object} doc - The object containing updates to the found document.
   * @param {object} [options] - An object containing options.
   * @param {Function} [cb] - A callback function to run.
   *
   * @returns {Promise<object>} The updated document.
   */
  async updateOne(filter, doc, options, cb) {
    try {
      // Create a new query object
      const query = new Query(this, null, options);
      // Get the properly formatted updateItem query
      const updateObj = query.updateItem(filter, doc);

      // Connect to the database
      const conn = await connect();

      M.log.debug(`DB OPERATION: ${this.TableName} updateItem`);
      // Update the single item
      const updatedItem = await conn.updateItem(updateObj).promise();
      // Return the properly formatted, newly updated document
      return await this.formatDocument(updatedItem.Attributes, options);
    }
    catch (error) {
      M.log.verbose(`Failed in ${this.modelName}.updateOne().`);
      throw error.captureError(error);
    }
  }

}

class Store extends DynamoDBStore {

  /**
   * @description Creates the DynamoDB store object and calls the parent
   * constructor with the store object.
   *
   * @param {object} [options] - An object containing options.
   */
  constructor(options) {
    const obj = {
      dynamoConfig: {
        accessKeyId: M.config.db.accessKeyId,
        secretAccessKey: M.config.db.secretAccessKey,
        region: M.config.db.region,
        endpoint: `${M.config.db.url}:${M.config.db.port}`
      },
      ttl: utils.timeConversions[M.config.auth.session.units] * M.config.auth.session.expires
    };

    // Call parent constructor
    super(obj);
  }

}


class Query {

  constructor(model, projection, options) {
    this.model = model;
    this.options = options;
    this.ExpressionAttributeNames = {};
    this.ExpressionAttributeValues = {};
    this.ProjectionExpression = '';
    this.FilterExpression = '';
    this.RequestItemsKeys = [];
    this.UpdateExpression = '';

    // Parse the projection
    this.parseProjection(projection);
  }


  /**
   * @description Parses the projection string and returns an object containing
   * the ProjectionExpression key/value and the ExpressionAttributeNames object.
   *
   * @param {string} projection - A space separated string of specific fields to
   * of a document.
   */
  parseProjection(projection) { // eslint-disable-line class-methods-use-this
    // Handle projections
    if (projection) {
      const fields = projection.split(' ');
      // For each field to return
      fields.forEach((f) => {
        // Handle special case where key name starts with an underscore
        const keyName = (f === '_id') ? 'id' : f;

        // Create unique key for field
        this.ExpressionAttributeNames[`#${keyName}`] = f;

        // If ProjectionExpression is not defined, init it
        if (!this.ProjectionExpression) {
          this.ProjectionExpression = `#${keyName}`;
        }
        // Add onto ProjectionExpression with leading comma
        else {
          this.ProjectionExpression += `,#${keyName}`;
        }
      });
    }
  }

  parseFilterExpression(query) {
    // Handle filter expression
    Object.keys(query).forEach((k) => {
      // Handle special case where key name starts with an underscore
      let keyName = (k === '_id') ? 'id' : k;

      // Handle case where searching nested object
      if (keyName.includes('.')) {
        const split = keyName.split('.');
        split.forEach((s) => {
          const kName = (s === '_id') ? 'id' : s;
          // Add key to ExpressionAttributeNames
          this.ExpressionAttributeNames[`#${kName}`] = s;
        });
        keyName = split.join('.#');
      }
      else {
        // Add key to ExpressionAttributeNames
        this.ExpressionAttributeNames[`#${keyName}`] = k;
      }

      const valueKey = (k.includes('.')) ? k.split('.').join('_') : k;

      // Handle the special $in case
      if (typeof query[k] === 'object' && query[k] !== null
          && Object.keys(query[k])[0] === '$in') {
        // Init the filter string
        let filterString = '';
        const arr = Object.values(query[k])[0];

        if (arr.length > 0) {
          // Loop over each item in arr
          for (let i = 0; i < arr.length; i++) {
            // Add value to ExpressionAttributeValues
            this.ExpressionAttributeValues[`:${valueKey}${i}`] = { S: arr[i] };

            // If FilterExpression is empty, init it
            if (!this.FilterExpression && !filterString) {
              filterString = `( #${keyName} = :${valueKey}${i}`;
            }
            else if (!filterString) {
              filterString = ` AND ( #${keyName} = :${valueKey}${i}`;
            }
            else {
              filterString += ` OR #${keyName} = :${valueKey}${i}`;
            }
          }

          filterString += ' )';
          this.FilterExpression += filterString;
        }
      }
      else {
        switch (typeof query[k]) {
          case 'string':
            this.ExpressionAttributeValues[`:${valueKey}`] = { S: query[k] };
            break;
          case 'boolean':
            this.ExpressionAttributeValues[`:${valueKey}`] = { BOOL: query[k] };
            break;
          case 'number':
            this.ExpressionAttributeValues[`:${valueKey}`] = {
              N: query[k].toString()
            };
            break;
          default: {
            console.log(query);
            throw new M.DatabaseError(
              `Query param type [${typeof query[k]}] is not supported`, 'critical'
            );
          }
        }

        // Handle special case where searching an array of permissions
        if (keyName.startsWith('permissions.')) {
          // If FilterExpression is not defined yet, define it
          if (this.FilterExpression === '') {
            this.FilterExpression = `contains (#${keyName}, :${valueKey})`;
          }
          else {
            // Append on condition
            this.FilterExpression += ` AND  contains (#${keyName}, :${valueKey})`;
          }
        }
        else {
          // If FilterExpression is not defined yet, define it
          if (this.FilterExpression === '') {
            this.FilterExpression = `#${keyName} = :${valueKey}`;
          }
          else {
            // Append on condition
            this.FilterExpression += ` AND #${keyName} = :${valueKey}`;
          }
        }
      }
    });
  }

  parseRequestItemsKeys(query) {
    const returnArray = [];
    const base = {};
    const inVals = {};

    // For each key in the query
    Object.keys(query).forEach((key) => {
      switch (typeof query[key]) {
        case 'string':
          base[key] = { S: query[key] };
          break;
        case 'number':
          base[key] = { N: query[key].toString() };
          break;
        case 'boolean':
          base[key] = { BOOL: query[key] };
          break;
        case 'object': {
          if (query[key] !== null) {
            // Handle the $in case
            if (Object.keys(query[key])[0] === '$in') {
              inVals[key] = Object.values(query[key])[0];
            }
          }
          break;
        }
        default:
          throw new M.DataFormatError(`Invalid type in query ${typeof query[key]}.`);
      }
    });

    // If no $in exists in the query, return the base query
    if (Object.keys(inVals).length === 0) {
      returnArray.push(base);
    }
    else {
      // For each in_val
      Object.keys(inVals).forEach((k) => {
        // For each item in the array to search through
        inVals[k].forEach((i) => {
          switch (typeof i) {
            case 'string':
              base[k] = { S: i };
              break;
            case 'number':
              base[k] = { N: i.toString() };
              break;
            default:
              throw new M.DataFormatError(`Invalid type in $in array ${typeof i}.`);
          }

          // Add on query, using JSON parse/stringify
          returnArray.push(JSON.parse(JSON.stringify(base)));
        });
      });
    }

    this.RequestItemsKeys = returnArray;
  }


  parseUpdateExpression(filter) {
    // Handle filter expression
    Object.keys(filter).forEach((k) => {
      // Handle special case where key name starts with an underscore
      let keyName = (k === '_id') ? 'id' : k;

      // Handle case where updating an object
      if (keyName.includes('.')) {
        const split = keyName.split('.');
        split.forEach((s) => {
          const kName = (s === '_id') ? 'id' : s;
          // Add key to ExpressionAttributeNames
          this.ExpressionAttributeNames[`#${kName}`] = s;
        });
        keyName = split.join('.#');
      }
      else {
        // Add key to ExpressionAttributeNames
        this.ExpressionAttributeNames[`#${keyName}`] = k;
      }

      const valueKey = (k.includes('.')) ? k.split('.')
      .join('_') : k;

      // Perform operation based on the type of parameter being updated
      switch (typeof filter[k]) {
        case 'string':
          this.ExpressionAttributeValues[`:${valueKey}`] = { S: filter[k] };
          break;
        case 'boolean':
          this.ExpressionAttributeValues[`:${valueKey}`] = { BOOL: filter[k] };
          break;
        case 'number':
          this.ExpressionAttributeValues[`:${valueKey}`] = {
            N: filter[k].toString()
          };
          break;
        case 'object': {
          console.log(keyName);
          console.log(filter[k]);
        }
          break;
        default: {
          throw new M.DatabaseError(
            `Query param type [${typeof filter[k]}] is not supported`, 'critical'
          );
        }
      }

      // If UpdateExpression is not defined yet, define it
      if (this.UpdateExpression === '') {
        this.UpdateExpression = `SET #${keyName} = :${valueKey}`;
      }
      else {
        // Append on condition
        this.UpdateExpression += `, #${keyName} = :${valueKey}`;
      }
    });
  }

  batchGetItem(filter) {
    this.parseRequestItemsKeys(filter);
    const queries = [];

    const baseObj = {
      RequestItems: {}
    };
    baseObj.RequestItems[this.model.TableName] = { Keys: [] };

    // Add on the ProjectionExpression and ExpressionAttributeNames if defined
    if (this.ProjectionExpression.length) {
      baseObj.RequestItems[this.model.TableName].ProjectionExpression = this.ProjectionExpression;
    }
    if (Object.keys(this.ExpressionAttributeNames).length !== 0) {
      baseObj.RequestItems[this.model.TableName]
      .ExpressionAttributeNames = this.ExpressionAttributeNames;
    }

    for (let i = 0; i < this.RequestItemsKeys.length / 25; i++) {
      baseObj.RequestItems[this.model.TableName].Keys = this.RequestItemsKeys
      .slice(i * 25, i * 25 + 25);
      queries.push(baseObj);
    }

    return queries;
  }

  getItem(filter) {
    this.parseRequestItemsKeys(filter);

    const baseObj = {
      TableName: this.model.TableName,
      Key: this.RequestItemsKeys[0]
    };

    // Add on the ProjectionExpression and ExpressionAttributeNames if defined
    if (this.ProjectionExpression.length) {
      baseObj.ProjectionExpression = this.ProjectionExpression;
    }
    if (Object.keys(this.ExpressionAttributeNames).length !== 0) {
      baseObj.ExpressionAttributeNames = this.ExpressionAttributeNames;
    }

    return baseObj;
  }

  updateItem(filter, doc) {
    this.parseUpdateExpression(doc);
    this.parseRequestItemsKeys(filter);

    const baseObj = {
      TableName: this.model.TableName,
      ReturnValues: 'ALL_NEW',
      Key: this.RequestItemsKeys[0]
    };

    // Add on the ProjectionExpression and ExpressionAttributeNames if defined
    if (this.ProjectionExpression.length) {
      baseObj.ProjectionExpression = this.ProjectionExpression;
    }
    if (Object.keys(this.ExpressionAttributeNames).length !== 0) {
      baseObj.ExpressionAttributeNames = this.ExpressionAttributeNames;
    }

    // Add on ExpressionAttributeValues and UpdateExpression if defined
    if (this.UpdateExpression.length) {
      baseObj.UpdateExpression = this.UpdateExpression;
    }
    if (Object.keys(this.ExpressionAttributeValues).length !== 0) {
      baseObj.ExpressionAttributeValues = this.ExpressionAttributeValues;
    }

    return baseObj;
  }

  deleteMany(filter) {
    this.parseRequestItemsKeys(filter);

    // Create batchWriteObj
    const baseObj = { RequestItems: {} };

    // Set table and DeleteRequest object
    baseObj.RequestItems[this.model.TableName] = [];

    // Loop over each query parameter
    this.RequestItemsKeys.forEach((k) => {
      // Create new delete request for each
      baseObj.RequestItems[this.model.TableName].push({
        DeleteRequest: {
          Key: k
        }
      });
    });

    return baseObj;
  }

  scan(query) {
    this.parseFilterExpression(query);
    const baseObj = {
      TableName: this.model.TableName
    };

    // Add on the ProjectionExpression and ExpressionAttributeNames if defined
    if (this.ProjectionExpression.length) {
      baseObj.ProjectionExpression = this.ProjectionExpression;
    }
    if (Object.keys(this.ExpressionAttributeNames).length !== 0) {
      baseObj.ExpressionAttributeNames = this.ExpressionAttributeNames;
    }

    // Add on ExpressionAttributeValues and FilterExpression if defined
    if (this.FilterExpression.length > 0) {
      baseObj.FilterExpression = this.FilterExpression;
    }
    // If not FilterExpression is defined, remove the ExpressionAttributeNames
    else if (!baseObj.hasOwnProperty('ProjectionExpression')) {
      delete baseObj.ExpressionAttributeNames;
    }
    if (Object.keys(this.ExpressionAttributeValues).length !== 0) {
      baseObj.ExpressionAttributeValues = this.ExpressionAttributeValues;
    }

    // For each options
    if (this.options) {
      // If the limit option is provided and is greater than 0
      if (this.options.limit && this.options.limit > 0) {
        baseObj.Limit = this.options.limit;
      }

      // If the option LastEvaluatedKey is provided, set it for pagination
      if (this.options.LastEvaluatedKey) {
        baseObj.LastEvaluatedKey = this.options.LastEvaluatedKey;
      }
    }

    return baseObj;
  }

}

// Export different classes and functions
module.exports = {
  connect,
  disconnect,
  clear,
  sanitize,
  Schema,
  Model,
  Store
};
