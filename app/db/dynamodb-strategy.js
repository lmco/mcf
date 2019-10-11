/**
 * Classification: UNCLASSIFIED
 *
 * @module db.dynamodb-strategy
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license LMPI - Lockheed Martin Proprietary Information
 *
 * @owner Austin Bieber <austin.j.bieber@lmco.com>
 *
 * @author Austin Bieber <austin.j.bieber@lmco.com>
 *
 * @description This file defines the schema strategy for using MBEE with
 * Amazon's DynamoDB
 */

// NPM modules
const AWS = require('aws-sdk');
const DynamoDBStore = require('dynamodb-store');

// MBEE modules
const utils = M.require('lib.utils');

// Define enhancedQueries
const enhancedQueries = {
  regex: true
};

/**
 * @description Creates the connection to the DynamoDB instance.
 *
 * @returns {Promise<*|Promise<unknown>>}
 */
async function connect() {
  return new Promise((resolve, reject) => {
    const dynamoDB = new AWS.DynamoDB({
      apiVersion: '2012-08-10',
      endpoint: 'http://localhost:8000',
      accessKeyId: 'fake',
      secretAccessKey: 'alsofake',
      region: 'US'
    });
    return resolve(dynamoDB);
    // dynamoDB.listTables({}, function(err, tables) {
    //   if (err) {
    //     M.log.error(err);
    //     return reject(err);
    //   }
    //   else {
    //     console.log(tables);
    //     return resolve();
    //   }
    // })
  });
}

function disconnect() {

}

async function clear() {
  return new Promise((resolve, reject) => {
    let conn;
    connect()
    .then((connection) => {
      conn = connection;
      return conn.listTables({}).promise();
    })
    .then((tables) => {
      const promises = [];
      tables.TableNames.forEach((table) => {
        promises.push(conn.deleteTable({ TableName: table }).promise());
      });

      return Promise.all(promises);
    })
    .then(() => resolve())
    .catch((error) => reject(error));
  });


}

// TODO: Figure out which fields need to be sanitized
function sanitize(data) {
  return data;
}

class Schema {

  constructor(definition, options) {
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
    this.definition = definition;
    this.add(definition);

    this.definition.hooks = { pre: [], post: [] };
    this.definition.methods = [];
    this.definition.statics = [];

    // Remove GlobalSecondaryIndex array if empty
    if (this.schema.GlobalSecondaryIndexes.length === 0) {
      this.schema.GlobalSecondaryIndexes = undefined;
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
    Object.keys(obj).forEach((key) => {
      if (!this.definition.hasOwnProperty(key)) {
        this.definition[key] = obj[key];
      }

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
        default: this.definition[key].type = 'S'; break;
      }

      // Handle indexes
      if (obj[key].index) {
        // Create attribute object
        const attributeObj = {
          AttributeName: key,
          AttributeType: obj[key].type
        };
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
        this.schema.GlobalSecondaryIndexes.push(indexObj);
      }
    });
  }

  /**
   * @description Registers a plugin for the schema.
   *
   * @param {function} cb - A callback function to run.
   * @param {Object} [options] - A object containing options.
   */
  plugin(cb, options) {
    this.cb = cb;
    this.cb(this);
    this.cb = undefined;
  }

  /**
   * @description Defines an index for the schema. Can support adding compound
   * or text indexes.
   *
   * @param {Object} fields - A object containing the key/values pairs where the
   * keys are the fields to add indexes to, and the values define the index type
   * where 1 defines an ascending index, -1 a descending index, and 'text'
   * defines a text index.
   * @param {Object} [options] - An object containing options.
   */
  index(fields, options) {
    // return super.index(fields, options);
  }

  /**
   * @description Defines a function to be run prior to a certain event
   * occurring.
   *
   * @param {(String|RegExp)} methodName - The event to run the callback
   * function before.
   * @param {Object} [options] - An object containing options.
   * @param {function} cb - The callback function to run prior to the event
   * occurring.
   */
  pre(methodName, options, cb) {
    const obj = {};
    // No options provided
    if (typeof options === 'function') {
      cb = options; // eslint-disable-line no-param-reassign
    }

    obj[methodName] = cb;
    this.definition.hooks.pre.push(obj);
  }

  /**
   * @description Defines a virtual field for the schema. Virtuals are not
   * stored in the database and rather are calculated post-find. Virtuals
   * generally will require a second request to retrieve referenced documents.
   * Populated virtuals contains a localField and foreignField which must match
   * for a document to be added to the virtual collection. For example, the
   * Organization Schema contains a virtual called "projects". This virtual
   * returns all projects who "org" field matches the organization's "_id".
   *
   * @param {String} name - The name of the field to be added to the schema
   * post-find.
   * @param {Object} [options] - An object containing options.
   * @param {(String|Model)} [options.ref] - The name of the model which the
   * virtual references.
   * @param {(String|Function)} [options.localField] - The field on the current
   * schema which is being used to match the foreignField.
   * @param {(String|Function)} [options.foreignField] - The field on the
   * referenced schema which is being used to match the localField.
   * @param {(boolean|Function)} [options.justOne] - If true, the virtual should
   * only return a single document. If false, the virtual will be an array of
   * documents.
   */
  virtual(name, options) {
    // return super.virtual(name, options);
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
   * @description Class constructor. Calls parent constructor, and ensures that
   * each of the required functions is defined in the parent class.
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

    // Add on methods
    if (Array.isArray(this.definition.statics)) {
      this.definition.statics.forEach((method) => {
        this[Object.keys(method)[0]] = Object.values(method)[0]; // eslint-disable-line
      });
    }
  }

  /**
   * @description Creates a table if it does not already exist in the database.
   * @async
   *
   * @returns {Promise<void>}
   */
  async init() {
    // Create connection to the database
    this.connection = await connect();
    // Grab all existing tables
    const tables = await this.listTables();
    // If the table does not currently exist
    if (!tables.TableNames.includes(this.TableName)) {
      await this.createTable();
    }
  }

  /**
   * @description Creates a table in the database based on the local schema and
   * tableName variables.
   *
   * @returns {Promise}
   */
  async createTable() {
    return new Promise((resolve, reject) => {
      // Set the TableName and BillingMode
      this.schema.TableName = this.TableName;
      this.schema.BillingMode = 'PAY_PER_REQUEST';

      M.log.debug(`DB OPERATION: ${this.TableName} createTable`);
      // Create the actual table
      this.connection.createTable(this.schema, (err) => {
        // If an error occurred, reject it
        if (err) {
          M.log.error(`Failed to create the table ${this.schema.TableName}.`);
          return reject(err);
        }
        else {
          return resolve();
        }
      });
    });
  }

  /**
   * @description Finds and returns an object containing a list of existing
   * table's names in the database.
   *
   * @returns {Promise<object>} An object containing table names.
   */
  async listTables() {
    return new Promise((resolve, reject) => {
      M.log.debug(`DB OPERATION: listTables`);
      // Find all tables
      this.connection.listTables({}).promise()
      .then((tables) => resolve(tables))
      .catch((err) => {
        M.log.error('Failed to find tables.');
        return reject(err);
      });
    });
  }

  /**
   * @description Formats documents to return them in the proper format
   * expected in controllers.
   *
   * @param {object[]} documents -  The documents to properly format.
   * @param {object} options - The options supplied to the function.
   *
   * @returns {object[]} - Modified documents.
   */
  formatDocuments(documents, options) {
    // Loop through each document
    for (let i = 0; i < documents.length; i++) {
      documents[i] = this.formatDocument(documents[i], options);
    }

    // Return modified documents
    return documents;
  }

  /**
   * @description Formats a single document and returns it in the proper format
   * expected in the controllers.
   *
   * @param {object} document -  The documents to properly format.
   * @param {object} options - The options supplied to the function.
   *
   * @returns {object} - Modified documents.
   */
  formatDocument(document, options = {}, recurse = false) {
    Object.keys(document).forEach((field) => {
      // If the string null, convert to actual value
      if (Object.values(document[field])[0] === 'null') {
        document[field][Object.keys(document[field])[0]] = null;
      }

      // Go through each type
      if (Object.keys(document[field])[0] === 'M') {
        document[field] = this.formatDocument(document[field].M, {}, true);
      }
      else if (Object.keys(document[field])[0] === 'N'
        && Object.values(document[field])[0] !== null) {
        // Change the value of each key from { type: value} to simply the value
        // and convert to Number
        document[field] = Number(Object.values(document[field])[0]);
      }
      else {
        // Change the value of each key from { type: value} to simply the value
        document[field] = Object.values(document[field])[0];
      }

      // Handle the special case where the type is a string, it defaults to null,
      // and the value in the database is the string null. This was done to work
      // around the existence of a NULL type in DynamoDB
      if (this.definition[field]
        && this.definition[field].hasOwnProperty('default')
        && this.definition[field].default === null
        && this.definition[field].type === 'S'
        && document[field] === 'null') {
        // Set value equal to null
        document[field] = null;
      }
    });

    // If the top level
    if (!recurse) {
      // Loop through all keys in definition
      Object.keys(this.definition).forEach((k) => {
        // If the key is not in the document
        if (!document.hasOwnProperty(k)) {
          // If the key has a default
          if (this.definition[k].hasOwnProperty('default')) {
            document[k] = this.definition[k].default;
          }
        }
      });
    }

    // If the lean option is NOT supplied, add on document functions
    if (!options.lean && !recurse) {
      document = this.createDocument(document); // eslint-disable-line no-param-reassign
    }

    return document;
  }

  async batchGetItem(filter, projection, options) {
    return new Promise((resolve, reject) => {
      // Initialize the batch get object
      const batchGetObj = { RequestItems: {} };
      batchGetObj.RequestItems[this.TableName] = {
        Keys: []
      };

      // Handle projections
      if (projection) {
        const fields = projection.split(' ');
        let index = 0;
        // For each field to return
        fields.forEach((f) => {
          // If the ExpressionAttributeNames is not defined, define it
          if (!batchGetObj.RequestItems[this.TableName].ExpressionAttributeNames) {
            batchGetObj.RequestItems[this.TableName].ExpressionAttributeNames = {};
          }

          // Create unique key for field
          batchGetObj.RequestItems[this.TableName]
          .ExpressionAttributeNames[`#val${index}`] = f;

          // If ProjectionExpression is not defined, init it
          if (!batchGetObj.RequestItems[this.TableName].ProjectionExpression) {
            batchGetObj.RequestItems[this.TableName].ProjectionExpression = `#val${index}`;
          }
          // Add onto ProjectionExpression with leading comma
          else {
            batchGetObj.RequestItems[this.TableName].ProjectionExpression += `,#val${index}`;
          }

          // Increment index
          index++;
        });
      }

      // Get all queries
      const queries = this.createQuery(filter);
      const queriesToMake = [];

      for (let i = 0; i < queries.length / 100; i++) {
        batchGetObj.RequestItems[this.TableName].Keys = queries.slice(i * 100, i * 100 + 100);
        queriesToMake.push(batchGetObj);
      }

      // If there are actually query parameters
      if (queriesToMake.length > 0) {
        let foundDocs = [];
        const promises = [];
        // For each query
        queriesToMake.forEach((q) => {
          // Log the database operation
          M.log.debug(`DB OPERATION: ${this.TableName} batchGetItem`);
          // Append operation to promises array
          promises.push(
            connect()
            .then((conn) => conn.batchGetItem(q).promise())
            .then((found) => {
              foundDocs = foundDocs.concat(found.Responses[this.TableName]);
            })
          );
        });

        // Wait for completion of all promises, and return formatted docs
        Promise.all(promises)
        .then(() => resolve(this.formatDocuments(foundDocs, options)))
        .catch((error) => {
          M.log.verbose('Failed in batchGetItem');
          return reject(error);
        });
      }
      else {
        return resolve([]);
      }
    });
  }

  async batchWriteItem(params, options) {
    return new Promise((resolve, reject) => {
      connect()
      .then((conn) => conn.batchWriteItem(params).promise())
      .then(() => resolve())
      .catch((error) => reject(error));
    });
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
   *
   * @returns {Promise<object>} Result of the bulkWrite operation.
   */
  async bulkWrite(ops, options, cb) {
    // return super.bulkWrite(ops, options, cb);
  }

  /**
   * @description Creates a document based on the model's schema.
   *
   * @param {object} doc - The JSON to be converted into a document. Should
   * roughly align with the model's schema. Each document created should at
   * least contain an _id, as well as the methods defined in the schema.
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
     *
     */
    doc.__proto__.validateSync = function(fields) { // eslint-disable-line no-proto
      let keys;
      // If fields provided and is an array , set equal to keys
      if (Array.isArray(fields)) {
        keys = fields;
      }
      // If only a single field is provided, ad to array
      else if (typeof fields === 'string') {
        keys = [fields];
      }
      else {
        keys = Object.keys(doc);
      }

      // Loop over each valid parameter
      Object.keys(def).forEach((param) => {
        // If a default exists and the value isn't set
        if (def[param].hasOwnProperty('default') && !keys.includes(param) && !fields) {
          if (typeof def[param].default === 'function') {
            doc[param] = def[param].default();
          }
          else if (def[param].default === '') {
            // Do nothing, empty strings cannot be saved in DynamoDB
          }
          else {
            // Set the value equal to th default
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

          // Run validators
          if (def[param].hasOwnProperty('validate')) {
            def[param].validate.forEach((v) => {
              if (!v.validator(doc[param])) {
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

          // If not in enum list, throw an error
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
     *
     * @return {Promise<*|Promise<unknown>>}
     */
    doc.__proto__.save = async function() { // eslint-disable-line no-proto
      return new Promise((resolve, reject) => {
        // Ensure the document is valid
        this.validateSync();
        const promises = [];
        if ('presave' in this) {
          promises.push(this.presave());
        }
        // If a pre hook is defined, it is run async
        Promise.all(promises)
        // Retrieve connection object
        .then(() => connect())
        .then((localConn) => {
          const putObj = {
            TableName: table,
            Item: {}
          };

          // Format the document object
          putObj.Item = model.formatObject(this);

          M.log.debug(`DB OPERATION: ${table} putItem`);
          // Save the document
          return localConn.putItem(putObj).promise();
        })
        .then(() => model.findOne({ _id: doc._id }))
        .then((foundDoc) => resolve(foundDoc))
        .catch((error) => reject(error));
      });
    };

    /**
     *
     * @param field
     */
    doc.__proto__.markModified = function(field) {}; // eslint-disable-line no-proto

    // Add on methods
    if (Array.isArray(def.methods)) {
      def.methods.forEach((method) => {
        doc.__proto__[Object.keys(method)[0]] = Object.values(method)[0]; // eslint-disable-line
      });
    }

    // Add on pre-hooks
    if (Array.isArray(def.hooks.pre)) {
      def.hooks.pre.forEach((hook) => {
        doc.__proto__[`pre${Object.keys(hook)[0]}`] = Object.values(hook)[0]; // eslint-disable-line
      });
    }

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
   * @returns {Promise<number>} The number of documents which matched the filter.
   */
  async countDocuments(filter, cb) {
    // return super.countDocuments(filter, cb);
  }

  /**
   * @description Deletes the specified index from the database.
   * @async
   *
   * @param {string} name - The name of the index.
   *
   * @returns {Promise<*>}
   */
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
    // Create batchWriteObj
    const batchWriteObj = { RequestItems: {} };

    // Set table and DeleteRequest object
    batchWriteObj.RequestItems[this.TableName] = [{ DeleteRequest: { Key: {} } }];

    // Format the conditions to align with DynamoDB format
    batchWriteObj.RequestItems[this.TableName][0].DeleteRequest.Key = this.formatObject(conditions);

    // Call batchWriteItem
    await this.batchWriteItem(batchWriteObj, options);
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
   * any.
   */
  async find(filter, projection, options, cb) {
    const params = Object.keys(filter);
    // Find all documents in the table if there are no keys or not every field is indexed
    if (Object.keys(filter).length === 0 || !params.every(p => this.indexes.includes(p))) {
      return this.scan(filter, projection, options);
    }
    else {
      return this.batchGetItem(filter, projection, options);
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
   * @returns {Promise<object>} The found document, if any.
   */
  async findOne(conditions, projection, options, cb) {
    // Loop through each field in the conditions object
    let allIndexed = true;
    Object.keys(conditions).forEach((key) => {
      // If the field is not indexed, set allIndexed to false
      if ((!this.definition[key].hasOwnProperty('index')
        || this.definition[key].index === false)
        && key !== '_id') {
        allIndexed = false;
      }
    });

    // If all fields are indexes, use getItem
    if (allIndexed) {
      return this.getItem(conditions, projection, options);
    }
    else {
      const result = await this.scan(conditions, projection, options);
      if (Array.isArray(result) && result.length !== 0) {
        return result[0];
      }
      else {
        return null;
      }
    }
  }

  /**
   * @description Returns an array of indexes for the given model.
   * @async
   *
   * @returns {Promise<object[]>} Array of index objects.
   */
  async getIndexes() {
    return new Promise((resolve, reject) => {
      M.log.debug(`DB OPERATION: ${this.TableName} describeTable`);
      this.connection.describeTable({ TableName: this.TableName }).promise()
      .then((table) => {
        return resolve(table.Table.KeySchema);
      })
      .catch((error) => {
        M.log.error('Failed to get indexes.');
        return reject(error);
      });
    });
  }

  /**
   * @description Gets a single item from a DynamoDB table. Helper function for
   * findOne().
   */
  async getItem(filter, projection, options) {
    return new Promise((resolve, reject) => {
      // Make the projection comma separated instead of space separated
      const projectionString = (projection) ? projection.split(' ').join(',') : undefined;
      const getObj = {
        Key: {},
        TableName: this.TableName,
        ProjectionExpression: projectionString
      };

      getObj.Key = this.formatObject(filter);

      M.log.debug(`DB OPERATION: ${this.TableName} getItem`);
      // Make the getItem request
      connect()
      .then((connection) => connection.getItem(getObj).promise())
      .then((foundItem) => {
        // If no document is found, return null
        if (Object.keys(foundItem).length === 0) {
          return resolve(null);
        }
        else {
          // Return the document
          return resolve(this.formatDocument(foundItem.Item, options));
        }
      })
      .catch((error) => {
        M.log.verbose('Failed in getItem');
        return reject(error)
      });
    });
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
    return new Promise((resolve, reject) => {
      const promises = [];
      let foundDocuments = [];
      // Loop through all docs in batches of 100
      for (let i = 0; i < docs.length / 100; i++) {
        const batch = docs.slice(i * 100, i * 100 + 100);
        const batchGetObj = {
          RequestItems: {}
        };
        batchGetObj.RequestItems[this.TableName] = { Keys: [] };
        batch.forEach((doc) => {
          batchGetObj.RequestItems[this.TableName].Keys.push(
            { _id: { S: doc._id } }
          );
        });
        M.log.debug(`DB OPERATION: ${this.TableName} batchGetItem`);
        promises.push(
          connect()
          .then((conn) => conn.batchGetItem(batchGetObj).promise())
          .then((foundDocs) => {
            foundDocuments = foundDocuments.concat(foundDocs.Responses[this.TableName]);
          })
          .catch((error) => {
            return reject(error);
          })
        );
      }

      Promise.all(promises)
      .then(() => {
        // If documents with matching _ids exist, throw an error
        if (foundDocuments.length > 0) {
          return reject(new M.DatabaseError('Documents already exist with '
            + 'matching _ids.', 'warn'));
        }
        else {
          const promises2 = [];
          // Format and validate documents
          const formattedDocs = docs.map(d => this.createDocument(d));
          formattedDocs.forEach(d => d.validateSync());
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
            promises2.push(
              connect()
              .then((conn) => conn.batchWriteItem(batchWriteObj).promise())
            );
          }

          return Promise.all(promises2);
        }
      })
      .then(() => {
        const promises3 = [];
        foundDocuments = [];
        // Loop through all docs in batches of 100
        for (let i = 0; i < docs.length / 100; i++) {
          const batch = docs.slice(i * 100, i * 100 + 100);
          const batchGetObj = {
            RequestItems: {}
          };
          batchGetObj.RequestItems[this.TableName] = { Keys: [] };
          batch.forEach((doc) => {
            batchGetObj.RequestItems[this.TableName].Keys.push({ _id: { S: doc._id } });
          });

          M.log.debug(`DB OPERATION: ${this.TableName} batchGetItem`);
          promises3.push(
            connect()
            .then((conn) => conn.batchGetItem(batchGetObj).promise())
            .then((foundDocs) => {
              foundDocuments = foundDocuments.concat(
                this.formatDocuments(foundDocs.Responses[this.TableName], options)
              );
            })
            .catch((error) => {
              return reject(error);
            })
          );
        }

        return Promise.all(promises3);
      })
      .then(() => resolve(foundDocuments))
      .catch((error) => {
        M.log.verbose('Failed in insertMany');
        return reject(error);
      });
    });
  }

  /**
   * @description Creates or replaces a single item in the specified table in
   * the DynamoDB database.
   */
  async putItem(doc, options) {
    return new Promise((resolve, reject) => {
      const putObj = {
        TableName: this.TableName,
        ReturnValues: 'ALL_NEW',
        Item: {}
      };

      putObj.Item = this.formatObject(doc);

      M.log.debug(`DB OPERATION: ${this.TableName} putItem`);
      // Save the document
      this.connection.putItem(putObj).promise()
      // .then((createdObj) => {
      //   console.log(createdObj);
      // })
      .catch((error) => {
        M.log.verbose('Failed in putItem');
        return reject(error)
      });
    });
  }

  /**
   * @description Creates a query to be used in scan, batchGetItem and getItem.
   *
   * @param {object} query - The query provided which is to be formatted to work
   * with DynamoDB.
   *
   * @returns {object[]} An array of queries to be called.
   */
  createQuery(query) {
    const returnArray = [];
    const base = {};
    const inVals = {};

    // For each key in the query
    Object.keys(query).forEach((key) => {
      switch (typeof query[key]) {
        case 'string': base[key] = { S: query[key] }; break;
        case 'number': base[key] = { N: query[key] }; break;
        case 'boolean': base[key] = { BOOL: query[key] }; break;
        case 'object': {
          if (query[key] !== null) {
            // Handle the $in case
            if (Object.keys(query[key])[0] === '$in') {
              inVals[key] = Object.values(query[key])[0];
            }
          }
          break;
        }
        default: throw new M.DataFormatError(`Invalid type in query ${typeof query[key]}.`);
      }
    });

    // If no $in exists in the query, return the base query
    if (Object.keys(inVals).length === 0) {
      returnArray.push(base);
      return returnArray;
    }
    else {
      // For each in_val
      Object.keys(inVals).forEach((k) => {
        // For each item in the array to search through
        inVals[k].forEach((i) => {
          switch (typeof i) {
            case 'string': base[k] = { S: i }; break;
            case 'number': base[k] = { N: i }; break;
            default: throw new M.DataFormatError(`Invalid type in $in array ${typeof i}.`);
          }

          // Add on query, using JSON parse/stringify
          returnArray.push(JSON.parse(JSON.stringify(base)));
        });
      });
      return returnArray;
    }
  }

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
   * @description Scans and returns every document in the specified table.
   * @async
   *
   * @param {object} filter - A list of fields to query.
   * @param {string} projection - The specific fields to return.
   * @param {object} options - A list of provided options.
   *
   * @returns {Promise<object[]>} The found documents.
   */
  async scan(filter, projection, options) {
    return new Promise((resolve, reject) => {
      const scanObj = {
        TableName: this.TableName
      };

      // Handle projections
      if (projection) {
        const fields = projection.split(' ');
        // For each field to return
        fields.forEach((f) => {
          // If the ExpressionAttributeNames is not defined, define it
          if (!scanObj.ExpressionAttributeNames) {
            scanObj.ExpressionAttributeNames = {};
          }

          const keyName = (f === '_id') ? 'id' : f;

          // Create unique key for field
          scanObj.ExpressionAttributeNames[`#${keyName}`] = f;

          // If ProjectionExpression is not defined, init it
          if (!scanObj.ProjectionExpression) {
            scanObj.ProjectionExpression = `#${keyName}`;
          }
          // Add onto ProjectionExpression with leading comma
          else {
            scanObj.ProjectionExpression += `,#${keyName}`;
          }
        });
      }

      Object.keys(filter).forEach((key) => {
        // Init ExpressionAttributeValues
        if (!scanObj.ExpressionAttributeValues) {
          scanObj.ExpressionAttributeValues = {};
        }

        // Init ExpressionAttributeNames
        if (!scanObj.ExpressionAttributeNames) {
          scanObj.ExpressionAttributeNames = {};
        }

        const value = filter[key];
        const keyName = (key === '_id') ? 'id' : key;

        if (!scanObj.ExpressionAttributeNames[`#${keyName}`]) {
          // Create unique key for field
          scanObj.ExpressionAttributeNames[`#${keyName}`] = key;
        }

        // If the value is a string
        if (typeof value === 'string') {
          scanObj.ExpressionAttributeValues[`:${key}`] = { S: value };
        }
        // If the value is an array of strings
        else if (Array.isArray(value) && value.every(v => typeof v === 'string')
          && value.length !== 0) {
          scanObj.ExpressionAttributeValues[`:${key}`] = { SS: value };
        }
        else if (typeof value === 'boolean') {
          scanObj.ExpressionAttributeValues[`:${key}`] = { BOOL: value };
        }

        if (!scanObj.FilterExpression) {
          scanObj.FilterExpression = `#${keyName} = :${key}`;
        }
        else {
          scanObj.FilterExpression += ` AND #${keyName} = :${key}`;
        }
      });

      M.log.debug(`DB OPERATION: ${this.TableName} scan`);
      connect()
      .then((conn) => conn.scan(scanObj).promise())
      .then((data) => resolve(this.formatDocuments(data.Items, options)))
      .catch((error) => {
        M.log.verbose('Failed in scan');
        return reject(error);
      });
    });
  }

  /**
   * @description Updates a single item in the database, matched by the fields
   * in the filter, and updated with the changes in doc.
   *
   * @param {object} filter - The query used to find the document.
   * @param {object} doc - An object containing changes to the found document.
   * @param {object} options - An object containing options.
   *
   * @returns {Promise<*|Promise<unknown>>}
   */
  async updateItem(filter, doc, options) {
    return new Promise((resolve, reject) => {
      const updateObj = {
        ExpressionAttributeNames: {},
        ExpressionAttributeValues: {},
        Key: {},
        TableName: this.TableName,
        UpdateExpression: 'SET',
        ReturnValues: 'ALL_NEW'
      };

      // For each parameter of the document being updated
      Object.keys(doc).forEach((param) => {
        // Set attribute name
        updateObj.ExpressionAttributeNames[`#${param}`] = param;

        const valueObj = {};
        // Get type of param
        valueObj[this.definition[param].type] = doc[param];
        // Set attribute value
        updateObj.ExpressionAttributeValues[`:${param}`] = valueObj;
        // if (param !== '$set')
        // Add the update to the update expression
        updateObj.UpdateExpression += ` #${param} = :${param},`;
      });

      // Remove trailing comma from UpdateExpression
      updateObj.UpdateExpression = updateObj.UpdateExpression.slice(0, -1);

      // For each parameter in the filter
      Object.keys(filter).forEach((key) => {
        // If the filter parameter is a field on the schema
        if (Object.keys(this.definition).includes(key)) {
          const value = filter[key];

          // If the value is a string
          if (typeof value === 'string') {
            updateObj.Key[key] = { S: value };
          }
          // If the value is an array of strings
          else if (Array.isArray(value) && value.every(v => typeof v === 'string')
            && value.length !== 0) {
            updateObj.Key[key] = { SS: value };
          }
        }
        else {
          M.log.error(`Filter param ${key} not a param on ${this.TableName} model.`);
        }
      });

      M.log.debug(`DB OPERATION: ${this.TableName} updateItem`);
      // Update the single item
      connect()
      .then((connection) => connection.updateItem(updateObj).promise())
      .then((updatedItem) => resolve(this.formatDocument(updatedItem.Attributes, options)))
      .catch((error) => {
        M.log.verbose('Failed in updateItem');
        return reject(error);
      });
    });
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
   * is updated with the doc provided.
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
    return this.updateItem(filter, doc, options);
  }

}

class Store extends DynamoDBStore {

  constructor(options) {
    const obj = {
      dynamoConfig: {
        accessKeyId: 'fake',
        secretAccessKey: 'alsofake',
        region: 'US',
        endpoint: 'http://localhost:8000'
      },
      ttl: utils.timeConversions[M.config.auth.session.units] * M.config.auth.session.expires
    };
    super(obj);
  }

}

// Export different classes and functions
module.exports = {
  enhancedQueries,
  connect,
  disconnect,
  clear,
  sanitize,
  Schema,
  Model,
  Store
};
