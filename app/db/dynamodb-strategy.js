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
      }]
    };
    this.definition = definition;

    Object.keys(this.definition).forEach((key) => {
      switch (this.definition[key].type) {
        case 'String': this.definition[key].type = 'S'; break;
        case 'Number': this.definition[key].type = 'N'; break;
        case 'Object': this.definition[key].type = 'M'; break;
        case 'Date': this.definition[key].type = 'N'; break;
        case 'Boolean': this.definition[key].type = 'N'; break;
        default: this.definition[key].type = 'S'; break;
      }
    });
  }

  /**
   * @description Adds an object/schema to the current schema.
   *
   * @param {(Object|Schema)} obj - The object or schema to add to the current
   * schema.
   * @param {String} [prefix] - The optional prefix to add to the paths in obj.
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
   * @param {String} name - The name of the model being created. This name is
   * used to create the collection name in the database.
   * @param {Schema} schema - The schema which is being turned into a model.
   * Should be an instance of the Schema class.
   * @param {String} [collection] - Optional name of the collection in the
   * database, if not provided the name should be used.
   */
  constructor(name, schema, collection) {
    this.schema = schema.schema;
    this.definition = schema.definition;
    this.TableName = collection;
  }

  /**
   * @description Creates a table if it does not already exist in the database.
   * @async
   *
   * @return {Promise<void>}
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
   * TableName variables.
   *
   * @return {Promise<*|Promise<unknown>>}
   */
  async createTable() {
    return new Promise((resolve, reject) => {
      // Set the TableName and BillingMode
      this.schema.TableName = this.TableName;
      this.schema.BillingMode = 'PAY_PER_REQUEST';

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
   * @return {Promise<Object>} An object containing table names.
   */
  async listTables() {
    return new Promise((resolve, reject) => {
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
   * @description Formats documents to return them in proper format, expected
   * in controllers.
   *
   * @param {Object[]} documents -  The documents to properly format
   * @param {Object} options - The options supplied to the function.
   *
   * @return {Object[]} - Modified documents.
   */
  formatDocuments(documents, options) {
    // Loop through each document
    documents.forEach((doc) => {
      // Loop through each key of the document
      Object.keys(doc).forEach((field) => {
        // Change the value of each key from { type: value} to simply the value
        doc[field] = Object.values(doc[field])[0];
      });
    });

    // Return modified documents
    return documents;
  }

  async batchGetItem(filter, projection, options) {
    return new Promise((resolve, reject) => {
      // Make the projection comma separated instead of space separated
      const projectionString = (projection) ? projection.split(' ').join(',') : '';

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
   * @param {Object[]} ops - An array of objects detailing what operations to
   * perform the data required for those operations.
   * @param {Object} [ops.insertOne] - Specified an insertOne operation.
   * @param {Object} [ops.insertOne.document] - The document to create, for
   * insertOne.
   * @param {Object} [ops.updateOne] - Specifies an updateOne operation.
   * @param {Object} [ops.updateOne.filter] - An object containing parameters to
   * filter the find query by, for updateOne.
   * @param {Object} [ops.updateOne.update] - An object containing updates to
   * the matched document from the updateOne filter.
   * @param {Object} [ops.deleteOne] - Specifies a deleteOne operation.
   * @param {Object} [ops.deleteOne.filter] - An object containing parameters to
   * filter the find query by, for deleteOne.
   * @param {Object} [ops.deleteMany] - Specifies a deleteMany operation.
   * @param {Object} [ops.deleteMany.filter] - An object containing parameters
   * to filter the find query by, for deleteMany.
   * @param {Object} [options] - An object containing options.
   * @param {function} [cb] - A callback function to run.
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
   * @return {Promise<Object>} Result of the bulkWrite operation.
   */
  async bulkWrite(ops, options, cb) {
    // return super.bulkWrite(ops, options, cb);
  }

  /**
   * @description Creates a document based on the model's schema.
   *
   * @param {Object} doc - The JSON to be converted into a document. Should
   * roughly align with the model's schema. Each document created should at
   * least contain an _id, as well as the methods defined in the schema.
   */
  createDocument(doc) {
    // return super.createDocument(doc);
  }

  /**
   * @description Counts the number of documents that matches a filter.
   * @async
   *
   * @param {Object} filter - An object containing parameters to filter the
   * find query by.
   * @param {function} [cb] - A callback function to run.
   *
   * @return {Promise<Number>} The number of documents which matched the filter.
   */
  async countDocuments(filter, cb) {
    // return super.countDocuments(filter, cb);
  }

  /**
   * @description Deletes the specified index from the database.
   * @async
   *
   * @param {String} name - The name of the index.
   *
   * @return {Promise<void>}
   */
  async deleteIndex(name) {
    // return super.deleteIndex(name);
  }

  /**
   * @description Deletes any documents that match the provided conditions.
   * @async
   *
   * @param {Object} conditions - An object containing parameters to filter the
   * find query by, and thus delete documents by.
   * @param {Object} [options] - An object containing options.
   * @param {function} [cb] - A callback function to run.
   *
   * @return {Promise<Object>} An object denoting the success of the delete
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
   * @return {Promise<void>}
   */
  async ensureIndexes() {
    // return super.ensureIndexes();
  }

  /**
   * @description Finds multiple documents based on the filter provided.
   * @async
   *
   * @param {Object} filter - An object containing parameters to filter the
   * find query by.
   * @param {(Object|String)} [projection] - Specifies the fields to return in
   * the documents that match the filter. To return all fields, omit this
   * parameter.
   * @param {Object} [options] - An object containing options.
   * @param {Object} [options.sort] - An object specifying the order by which
   * to sort and return the documents. Keys are fields by which to sort, and
   * values are the sort order where 1 is ascending and -1 is descending. It is
   * possible to sort by metadata by providing the key $meta and a non-numerical
   * value. This is used primarily for text based search.
   * @param {Number} [options.limit] - Limits the number of documents returned.
   * A limit of 0 is equivalent to setting no limit and a negative limit is not
   * supported.
   * @param {Number} [options.skip] - Skips a specified number of documents that
   * matched the query. Given 10 documents match with a skip of 5, only the
   * final 5 documents would be returned. A skip value of 0 is equivalent to not
   * skipping any documents. A negative skip value is not supported.
   * @param {String} [options.populate] - A space separated list of fields to
   * populate of return of a document. Only fields that reference other
   * documents can be populated. Populating a field returns the entire
   * referenced document instead of that document's ID. If no document exists,
   * null is returned.
   * @param {Boolean} [options.lean] - If false (by default), every document
   * returned will contain methods that were declared in the Schema. If true,
   * just the raw JSON will be returned from the database.
   * @param {function} [cb] - A callback function to run.
   *
   * @return {Promise<Object[]>} An array containing the found documents, if
   * any.
   */
  async find(filter, projection, options, cb) {
    // Find all documents in the table
    if (Object.keys(filter).length === 0) {
      return this.scan(options);
    }
    else {
      return this.batchGetItem(filter, projection, options);
    }
  }

  /**
   * @description Finds a single document based on the filter provided.
   * @async
   *
   * @param {Object} conditions - An object containing parameters to filter the
   * find query by.
   * @param {(Object|String)} [projection] - Specifies the fields to return in
   * the document that matches the filter. To return all fields, omit this
   * parameter.
   * @param {Object} [options] - An object containing options.
   * @param {String} [options.populate] - A space separated list of fields to
   * populate of return of a document. Only fields that reference other
   * documents can be populated. Populating a field returns the entire
   * referenced document instead of that document's ID. If no document exists,
   * null is returned.
   * @param {Boolean} [options.lean] - If false (by default), every document
   * returned will contain methods that were declared in the Schema. If true,
   * just the raw JSON will be returned from the database.
   * @param {function} [cb] - A callback function to run.
   *
   * @return {Promise<Object>} The found document, if any.
   */
  async findOne(conditions, projection, options, cb) {
    // return super.findOne(conditions, projection, options, cb);
  }

  /**
   * @description Returns an array of indexes for the given model.
   * @async
   *
   * @return {Promise<Object[]>} Array of index objects
   */
  async getIndexes() {
    return new Promise((resolve, reject) => {
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
   * @description Inserts any number of documents into the database.
   * @async
   *
   * @param {Object[]} docs - An array of documents to insert.
   * @param {Object} [options] - An object containing options.
   * @param {Boolean} [options.lean] - If false (by default), every document
   * returned will contain methods that were declared in the Schema. If true,
   * just the raw JSON will be returned from the database.
   * @param {Boolean} [options.skipValidation] - If true, will not validate
   * the documents which are being created.
   * @param {function} [cb] - A callback function to run.
   *
   * @return {Promise<Object[]>} The created documents.
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
   * @description Scans and returns every document in the specified table.
   * @async
   *
   * @param {Object} options - A list of provided options.
   *
   * @return {Promise<Object[]>} The found documents.
   */
  async scan(options) {
    return new Promise((resolve, reject) => {
      this.connection.scan({ TableName: this.TableName }, (err, data) => {
        if (err) {
          return reject(err);
        }
        else {
          return resolve(this.formatDocuments(data.Items, options));
        }
      });
    });
  }

  /**
   * @description Updates multiple documents matched by the filter with the same
   * changes in the provided doc.
   * @async
   *
   * @param {Object} filter - An object containing parameters to filter the
   * find query by.
   * @param {Object} doc - The object containing updates to the found documents.
   * @param {Object} [options] - An object containing options.
   * @param {function} [cb] - A callback function to run.
   */
  async updateMany(filter, doc, options, cb) {
    // return super.updateMany(filter, doc, options, cb);
  }

  /**
   * @description Updates a single document which is matched by the filter, and
   * is updated with the doc provided.
   * @async
   *
   * @param {Object} filter - An object containing parameters to filter the
   * find query by.
   * @param {Object} doc - The object containing updates to the found document.
   * @param {Object} [options] - An object containing options.
   * @param {function} [cb] - A callback function to run.
   *
   * @return {Promise<Object>} The updated document.
   */
  async updateOne(filter, doc, options, cb) {
    // return super.updateOne(filter, doc, options, cb);
  }

}

/**
 * @description Defines the Store class. The Store class is used along with
 * express-session to manage sessions. The class MUST extend the node's built in
 * EventEmitter class. Please review the express-session documentation at
 * {@link https://github.com/expressjs/session#session-store-implementation}
 * to learn more about the Store implementation. There are many libraries
 * available that support different databases, and a list of those are also
 * available at the link above.
 */
class Store {

  constructor(options) {
    // super(options);
    //
    // if (!(this instanceof events)) {
    //   M.log.critical('The Store class must extend the Node.js EventEmitter '
    //     + 'class!');
    //   process.exit(1);
    // }
    //
    // // Check that expected functions are defined
    // const expectedFunctions = ['destroy', 'get', 'set'];
    // expectedFunctions.forEach((f) => {
    //   // Ensure the parameter is defined
    //   if (!(f in this)) {
    //     M.log.critical(`The Store function ${f} is not defined!`);
    //     process.exit(1);
    //   }
    //   // Ensure it is a function
    //   if (typeof this[f] !== 'function') {
    //     M.log.critical(`The Store function ${f} is not a function!`);
    //     process.exit(1);
    //   }
    // });
  }

  /**
   * @description An optional function used to get all sessions in the store
   * as an array.
   *
   * @param {function} cb - The callback to run, should be called as
   * cb(error, sessions).
   */
  all(cb) {
    // return super.all(cb);
  }

  /**
   * @description A required function which deletes a given session from the
   * store.
   *
   * @param {String} sid - The ID of the session to delete.
   * @param {function} cb - The callback to run, should be called as cb(error).
   */
  destroy(sid, cb) {
    // return super.destroy(sid, cb);
  }

  /**
   * @description An optional function which deletes all sessions from the
   * store.
   *
   * @param {function} cb - The callback to run, should be called as cb(error).
   */
  clear(cb) {
    // return super.clear(cb);
  }

  /**
   * @description An optional function which gets the count of all session in
   * the store.
   *
   * @param {function} cb - The callback to run, should be called as
   * cb(error, len).
   */
  length(cb) {
    // return super.length(cb);
  }

  /**
   * @description A required function which gets the specified session from the
   * store.
   *
   * @param {String} sid - The ID of the session to retrieve.
   * @param {function} cb - The callback to run, should be called as
   * cb(error, session). The session argument should be the session if found,
   * otherwise null or undefined if not found.
   */
  get(sid, cb) {
    // return super.get(sid, cb);
  }

  /**
   * @description A required function which upserts a given session into the
   * store.
   *
   * @param {String} sid - The ID of the session to upsert.
   * @param {Object} session - The session object to upsert.
   * @param {function} cb - The callback to run, should be called as cb(error).
   */
  set(sid, session, cb) {
    // return super.set(sid, session, cb);
  }

  /**
   * @description An optional yet recommended function which "touches" a given
   * session. This function is used to reset the idle timer on an active session
   * which may be potentially deleted.
   *
   * @param {String} sid - The ID of the session to "touch".
   * @param {Object} session - The session to "touch".
   * @param {function} cb - The callback to run, should be called as cb(error).
   */
  touch(sid, session, cb) {
    // return super.touch(sid, session, cb);
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
