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
    .catch((error) => reject(error));
  });


}

function sanitize() {

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

    Object.keys(this.definition).forEach((key) => {
      switch (this.definition[key].type) {
        case 'String': this.definition[key].type = 'S'; break;
        case 'Number': this.definition[key].type = 'N'; break;
        case 'Object': this.definition[key].type = 'M'; break;
        case 'Date': this.definition[key].type = 'N'; break;
        case 'Boolean': this.definition[key].type = 'BOOL'; break;
        default: this.definition[key].type = 'S'; break;
      }

      // Handle indexes
      if (this.definition[key].index) {
        // Create attribute object
        const attributeObj = {
          AttributeName: key,
          AttributeType: this.definition[key].type
        };
        this.schema.AttributeDefinitions.push(attributeObj);

        // Create index object
        const indexObj = {
          IndexName: `${key}_1`,
          KeySchema: [
            {
              AttributeName: key,
              KeyType: (this.definition[key].type === 'S') ? 'HASH' : 'RANGE'
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
    // return super.add(obj, prefix);
  }

  /**
   * @description Registers a plugin for the schema.
   *
   * @param {function} cb - A callback function to run.
   * @param {Object} [options] - A object containing options.
   */
  plugin(cb, options) {
    // return super.plugin(cb, options);
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
    // return super.pre(methodName, options, cb);
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
   * @param {String} name - The name of the static function.
   * @param {function} fn - The function to be added to the model.
   */
  static(name, fn) {
    // return super.static(name, fn);
  }

  /**
   * @description Adds a non-static method to the schema, which later will be an
   * instance method on the model.
   *
   * @param {String} name - The name of the non-static function.
   * @param {function} fn - The function to be added to the model.
   */
  method(name, fn) {
    // return super.method(name, fn);
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
  formatDocument(document, options = {}) {
    Object.keys(document).forEach((field) => {
      if (Object.keys(document[field])[0] === 'M') {
        document[field] = this.formatDocument(document[field].M);
      }
      else {
        // Change the value of each key from { type: value} to simply the value
        document[field] = Object.values(document[field])[0];
      }
    });

    // If the lean option is NOT supplied, add on document functions
    if (!options.lean) {
      document = this.createDocument(document); // eslint-disable-line no-param-reassign
    }

    return document;
  }

  async batchGetItem(filter, projection, options) {
    return new Promise((resolve, reject) => {
      // Make the projection comma separated instead of space separated
      const projectionString = (projection) ? projection.split(' ').join(',') : undefined;

      // Initialize the batch get object
      const batchGetObj = { RequestItems: {} };
      batchGetObj.RequestItems[this.TableName] = {
        Keys: [],
        ProjectionExpression: projectionString
      };

      // Loop through each field in the filter
      Object.keys(filter).forEach((key) => {
        // If the filter parameter is a field on the schema
        if (Object.keys(this.definition).includes(key)) {
          const value = filter[key];
          const getObj = {};

          // If the value is a string
          if (typeof value === 'string') {
            getObj[key] = { S: value };
          }
          // If the value is an array of strings
          else if (Array.isArray(value) && value.every(v => typeof v === 'string')
            && value.length !== 0) {
            getObj[key] = { SS: value };
          }

          // If the getObj is populated
          if (Object.keys(getObj).length > 0) {
            // Add the get object to the list of keys to search
            batchGetObj.RequestItems[this.TableName].Keys.push(getObj);
          }
        }
        else {
          M.log.error(`Filter param ${key} not a param on ${this.TableName} model.`);
        }
      });

      // If there are actually query parameters
      if (batchGetObj.RequestItems[this.TableName].Keys.length > 0) {
        M.log.debug(`DB OPERATION: ${this.TableName} batchGetItem`);
        // Make the batchGetItem request
        this.connection.batchGetItem(batchGetObj)
        .promise()
        .then((foundDocs) => resolve(foundDocs.Responses[this.TableName]))
        .catch((error) => reject(error));
      }
      else {
        return resolve([]);
      }
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
    const def = this.definition;
    const table = this.TableName;
    const conn = this.connection;
    const modelName = this.modelName;
    const model = this;

    /**
     *
     */
    doc.__proto__.validateDoc = function() { // eslint-disable-line no-proto
      const keys = Object.keys(doc);
      // Loop over each valid parameter
      Object.keys(def).forEach((param) => {
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

          // If not the correct type, throw an error
          if (typeof doc[param] !== shouldBeType) { // eslint-disable-line valid-typeof
            throw new M.DataFormatError(`The ${modelName} parameter `
              + `[${param}] is not a ${shouldBeType}.`);
          }

          // Run validators
          if (def[param].hasOwnProperty('validate')) {
            def[param].validate.forEach((v) => {
              if (!v.validator(doc[param])) {
                throw new M.DataFormatError(v.message);
              }
            });
          }
        }
        // If the parameter was not defined on the document
        else {
          // If the parameter is required and no default is provided, throw an error
          if (def[param].required && !def[param].default) {
            throw new M.DataFormatError(`The ${modelName} property ${param}`
              + ' is required.');
          }

          // If a default exists
          if (def[param].default) {
            doc[param] = def[param].default;
          }
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
        this.validateDoc();

        const putObj = {
          TableName: table,
          Item: {}
        };

        // Format the document object
        putObj.Item = model.formatObject(this)

        M.log.debug(`DB OPERATION: ${table} putItem`);
        // Save the document
        conn.putItem(putObj).promise()
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
    // return super.deleteMany(conditions, options, cb);
  }

  /**
   * @description Creates all indexes (if not already created) for the model's
   * schema.
   * @async
   *
   * @returns {Promise<*>}
   */
  async ensureIndexes() {
    // return super.ensureIndexes();
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
    // Find all documents in the table
    if (Object.keys(filter).length === 0) {
      return this.scan({}, projection, options);
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

      // Loop through each field in the filter
      Object.keys(filter).forEach((key) => {
        // If the filter parameter is a field on the schema
        if (Object.keys(this.definition).includes(key)) {
          const value = filter[key];

          // If the value is a string
          if (typeof value === 'string') {
            getObj.Key[key] = { S: value };
          }
          // If the value is an array of strings
          else if (Array.isArray(value) && value.every(v => typeof v === 'string')
            && value.length !== 0) {
            getObj.Key[key] = { SS: value };
          }
          else if (typeof value === 'boolean') {
            getObj.Key[key] = { BOOL: value };
          }
        }
        else {
          M.log.error(`Filter param ${key} not a param on ${this.TableName} model.`);
        }
      });

      M.log.debug(`DB OPERATION: ${this.TableName} getItem`);
      // Make the getItem request
      this.connection.getItem(getObj).promise()
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
      .catch((error) => reject(error));
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
            { _id: { S: doc._id } });
        });
        M.log.debug(`DB OPERATION: ${this.TableName} batchGetItem`);
        promises.push(
          this.connection.batchGetItem(batchGetObj).promise()
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
          return reject(new M.DatabaseError('Documents already exists with '
            + 'matching _ids.', 'warn'));
        }
        else {
          const promises2 = [];
          let createdDocs = [];
          // Loop through all docs in batches of 25
          for (let i = 0; i < docs.length / 25; i++) {
            const batch = docs.slice(i * 25, i * 25 + 25);
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
              Object.keys(doc).forEach((key) => {
                if (this.definition[key]) {
                  putObj.PutRequest.Item[key] = {};
                  putObj.PutRequest.Item[key][this.definition[key].type] = doc[key];
                }
              });

              batchWriteObj.RequestItems[this.TableName].push(putObj);
            });

            M.log.debug(`DB OPERATION: ${this.TableName} batchWriteItem`);
            promises2.push(
              this.connection.batchWriteItem(batchWriteObj).promise()
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
            this.connection.batchGetItem(batchGetObj).promise()
            .then((foundDocs) => {
              foundDocuments = foundDocuments.concat(foundDocs.Responses[this.TableName]);
            })
            .catch((error) => {
              return reject(error);
            })
          );
        }

        return Promise.all(promises3);
      })
      .then(() => resolve(foundDocuments))
      .catch((error) => reject(error));
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
      console.log(putObj)

      M.log.debug(`DB OPERATION: ${this.TableName} putItem`);
      // Save the document
      this.connection.putItem(putObj).promise()
      .then((createdObj) => {
        console.log(createdObj);
      })
      .catch((error) => reject(error));
    });
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
        case 'number': returnObj[key] = { N: obj[key] }; break;
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
            // TODO: Do something?
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
      // Make the projection comma separated instead of space separated
      const projectionString = (projection) ? projection.split(' ').join(',') : undefined;
      const scanObj = {
        ProjectionExpression: projectionString,
        TableName: this.TableName
      };

      Object.keys(filter).forEach((key) => {
        if (!scanObj.ExpressionAttributeValues) {
          scanObj.ExpressionAttributeValues = {};
        }

        const value = filter[key];

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
          scanObj.FilterExpression = `${key} = :${key}`;
        }
        else {
          scanObj.FilterExpression += `, ${key} = :${key}`;
        }
      });

      M.log.debug(`DB OPERATION: ${this.TableName} scan`);
      this.connection.scan(scanObj).promise()
      .then((data) => resolve(this.formatDocuments(data.Items, options)))
      .catch((error) => reject(error));
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
      this.connection.updateItem(updateObj).promise()
      .then((updatedItem) => resolve(this.formatDocument(updatedItem.Attributes, options)))
      .catch((error) => reject(error));
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
  connect,
  disconnect,
  clear,
  sanitize,
  Schema,
  Model,
  Store
};
