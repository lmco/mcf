/**
 * @classification UNCLASSIFIED
 *
 * @module db.mongoose-mongodb-strategy
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license LMPI - Lockheed Martin Proprietary Information
 *
 * @owner Austin Bieber <austin.j.bieber@lmco.com>
 *
 * @author Austin Bieber <austin.j.bieber@lmco.com>
 *
 * @description This file defines the schema strategy for using MBEE with Mongoose
 * and MongoDB.
 */
/* eslint-disable jsdoc/require-description-complete-sentence */
// Disabled to allow chart in description

// Node modules
const fs = require('fs');
const path = require('path');

// NPM Modules
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);

/**
 * @description Create connection to database.
 *
 * @returns {Promise} Resolved promise.
 */
function connect() {
  return new Promise((resolve, reject) => {
    // Declare variables for mongoose connection
    const dbName = M.config.db.name;
    const url = M.config.db.url;
    const dbPort = M.config.db.port;
    const dbUsername = M.config.db.username;
    const dbPassword = M.config.db.password;
    let connectURL = 'mongodb://';

    // If username/password provided
    if (dbUsername !== '' && dbPassword !== '' && dbUsername && dbPassword) {
      // Append username/password to connection URL
      connectURL = `${connectURL + dbUsername}:${dbPassword}@`;
    }
    connectURL = `${connectURL + url}:${dbPort}/${dbName}`;

    const options = {};

    // Configure an SSL connection
    // The 'sslCAFile' references file located in /certs.
    if (M.config.db.ssl) {
      connectURL += '?ssl=true';
      // Retrieve CA file from /certs directory
      const caPath = path.join(M.root, M.config.db.ca);
      const caFile = fs.readFileSync(caPath, 'utf8');
      options.sslCA = caFile;
    }

    // Remove mongoose deprecation warnings
    mongoose.set('useFindAndModify', false);
    mongoose.set('useNewUrlParser', true);
    mongoose.set('useCreateIndex', true);
    mongoose.set('useUnifiedTopology', true);

    // Database debug logs
    // Additional arguments may provide too much information
    mongoose.set('debug', function(collectionName, methodName, arg1, arg2, arg3) {
      M.log.debug(`DB OPERATION: ${collectionName}, ${methodName}`);
    });

    // Connect to database
    mongoose.connect(connectURL, options, (err) => {
      if (err) {
        // If error, reject it
        return reject(err);
      }
      return resolve();
    });
  });
}

/**
 * @description Closes connection to database.
 *
 * @returns {Promise} Resolved promise.
 */
function disconnect() {
  return new Promise((resolve, reject) => {
    mongoose.connection.close()
    .then(() => resolve())
    .catch((error) => reject(error));
  });
}

/**
 * @description Clears all contents from the database, equivalent to starting
 * from scratch. Used in 000 and 999 tests, which SHOULD NOT BE RUN IN PRODUCTION.
 * @async
 *
 * @returns {Promise<null>} Resolves an empty promise upon completion.
 */
async function clear() {
  return mongoose.connection.db.dropDatabase();
}

/**
 * @description Sanitizes data which will be used in queries and inserted into
 * the database. If the data contains a $, which is a MongoDB reserved
 * character, the object key/value pair will be deleted.
 *
 * <p> +-------+-----------------+
 * <br>| Input | Sanitized Output|
 * <br>+-------+-----------------+
 * <br>|   $   |                 |
 * <br>+-------+-----------------+ </p>
 *
 * @param {*} data - User input to be sanitized. May be in any data format.
 *
 * @returns {*} Sanitized user input.
 */
function sanitize(data) {
  if (Array.isArray(data)) {
    return data.map((value) => this.sanitize(value));
  }
  else if (data instanceof Object) {
    // Check for '$' in each key parameter of userInput
    Object.keys(data).forEach((key) => {
      // If '$' in key, remove key from userInput
      if (/^\$/.test(key)) {
        delete data[key];
      }
      // If the value is an object
      else if (typeof data[key] === 'object' && data[key] !== null) {
        // Recursively call function on value
        this.sanitize(data[key]);
      }
    });
  }
  // Return modified userInput
  return data;
}

class Schema extends mongoose.Schema {

  constructor(definition, options) {
    super(definition, options);

    // Required for virtual getters
    this.set('toJSON', { virtuals: true });
    this.set('toObject', { virtuals: true });
  }

  /**
   * @description Overrides the mongoose.Schema add function to properly handle
   * the special mongoose types.
   *
   * @param {object|Schema} obj - Plain object with paths to add, or another
   * schema.
   * @param {string} [prefix] - Path to prefix the newly added paths with.
   *
   * @returns {Promise<null>} Resolves an empty promise upon completion.
   */
  add(obj, prefix) {
    /**
     * @description Change each type to the mongoose defined type.
     *
     * @param {object} object - Object with paths to add, or another schema.
     */
    function changeType(object) {
      Object.keys(object).forEach((k) => {
        // If a nested schema, handle each nested parameter
        if (Array.isArray(object[k])) {
          // Call recursively
          object[k].forEach((j) => changeType(j));
        }
        else {
          // If not an object, use mongoose defined type
          switch (object[k].type) {
            case 'String': object[k].type = String; break;
            case 'Number': object[k].type = Number; break;
            case 'Boolean': object[k].type = Boolean; break;
            case 'Date': object[k].type = Date; break;
            case 'Object': object[k].type = mongoose.Schema.Types.Mixed; break;
            default: object[k].type = String;
          }
        }
      });
    }

    // Call changeType()
    changeType(obj);

    // Call parent add
    return super.add(obj, prefix);
  }

}

class Model {

  /**
   * @description Class constructor. Initializes the mongoose model and stores
   * it in a variable called "model", in addition to the schema and model name.
   * Adds static functions from schema onto class.
   *
   * @param {string} name - The name of the model being created. This name is
   * used to create the collection name in the database.
   * @param {Schema} schema - The schema which is being turned into a model.
   * Should be an instance of the Schema class.
   * @param {string} [collection] - Optional name of the collection in the
   * database, if not provided the name should be used.
   */
  constructor(name, schema, collection) {
    // Instantiate the mongoose model
    this.model = mongoose.model(name, schema, collection);
    this.modelName = name;
    this.schema = schema;

    // Add static functions to the model
    Object.keys(schema.statics).forEach((f) => {
      this[f] = schema.statics[f];
    });
  }

  /**
   * @description Unused init function.
   * @async
   *
   * @returns {Promise<void>} Returns empty promise upon completion.
   */
  async init() { // eslint-disable-line class-methods-use-this

  }

  /**
   * @description Performs a large write operation on a collection. Can create,
   * update, or delete multiple documents. Calls the mongoose bulkWrite()
   * function.
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
    return this.model.bulkWrite(ops, options, cb);
  }

  /**
   * @description Creates a mongoose Document based on the model's schema.
   * Creates a new instance of the mongoose Model.
   *
   * @param {object} doc - The object to convert to a Document.
   *
   * @returns {Document} Returns a database document.
   */
  createDocument(doc) {
    return new this.model(doc); // eslint-disable-line new-cap
  }

  /**
   * @description Counts the number of documents that matches a filter. Calls
   * the mongoose countDocuments() function.
   * @async
   *
   * @param {object} filter - An object containing parameters to filter the
   * find query by.
   * @param {Function} [cb] - A callback function to run.
   *
   * @returns {Promise<number>} The number of documents which matched the filter.
   */
  async countDocuments(filter, cb) {
    return this.model.countDocuments(filter, cb);
  }

  /**
   * @description Deletes the specified index from the database. Calls the
   * mongoose collection.dropIndex() function.
   * @async
   *
   * @param {string} name - The name of the index.
   *
   * @returns {Promise<void>} Returns an empty promise upon completion.
   */
  async deleteIndex(name) {
    return this.model.collection.dropIndex(name);
  }

  /**
   * @description Deletes any documents that match the provided conditions.
   * Calls the mongoose deleteMany() function.
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
    return this.model.deleteMany(conditions, options, cb);
  }

  /**
   * @description Creates all indexes (if not already created) for the model's
   * schema. Calls the mongoose ensureIndexes() function.
   * @async
   *
   * @returns {Promise<void>} Returns an empty promise upon completion.
   */
  async ensureIndexes() {
    return this.model.ensureIndexes();
  }

  /**
   * @description Finds multiple documents based on the filter provided. Calls
   * the mongoose find() function.
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
    return this.model.find(filter, projection, options, cb);
  }

  /**
   * @description Finds a single document based on the filter provided. Calls
   * the mongoose findOne() function.
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
    return this.model.findOne(conditions, projection, options, cb);
  }

  /**
   * @description Returns an array of indexes for the given model. Calls the
   * mongoose collection.indexes() function.
   * @async
   *
   * @returns {Promise<object[]>} Array of index objects.
   */
  async getIndexes() {
    return this.model.collection.indexes();
  }

  /**
   * @description Inserts any number of documents into the database. Calls the
   * mongoose insertMany() function.
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
    let useCollection = false;

    // Replace the lean option with rawResult
    if (options && options.lean) {
      options.rawResult = true;
      delete options.lean;
    }

    // Set useCollection if skipValidation is true
    if (options && options.skipValidation) {
      useCollection = true;
      delete options.skipValidation;
    }

    let documents = [];

    // If useCollection is true, use the MongoDB function directly
    if (useCollection) {
      documents = await this.model.collection.insertMany(docs);
    }
    else {
      // Insert the documents
      documents = await this.model.insertMany(docs, options, cb);
    }

    if (options && options.rawResult) {
      // Query returned, return just the documents
      return documents.ops;
    }
    else {
      return documents;
    }
  }

  /**
   * @description Updates multiple documents matched by the filter with the same
   * changes in the provided doc. Calls the mongoose updateMany() function.
   * @async
   *
   * @param {object} filter - An object containing parameters to filter the
   * find query by.
   * @param {object} doc - The object containing updates to the found documents.
   * @param {object} [options] - An object containing options.
   * @param {Function} [cb] - A callback function to run.
   *
   * @returns {Promise<object[]>} The updated objects.
   */
  async updateMany(filter, doc, options, cb) {
    return this.model.updateMany(filter, doc, options, cb);
  }

  /**
   * @description Updates a single document which is matched by the filter, and
   * is updated with the doc provided. Calls the mongoose updateOne() function.
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
    return this.model.updateOne(filter, doc, options, cb);
  }

}

class Store extends MongoStore {

  constructor(options) {
    super({ mongooseConnection: mongoose.connection });
  }

}

module.exports = {
  connect,
  disconnect,
  clear,
  sanitize,
  Schema,
  Model,
  Store
};
