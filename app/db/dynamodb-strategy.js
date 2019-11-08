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

// Define a function wide variable models, which stores each model when it gets created
// this is later used for population of documents across models
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
 * @async
 *
 * @returns {Promise} Resolves every time.
 */
async function disconnect() {
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

    // Define statics
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

}

class Query {

  constructor(model, options) {
    this.model = model;
    this.options = options;
    this.ExpressionAttributeNames = {};
    this.ExpressionAttributeValues = {};
    this.RequestItemsKeys = [];
    this.UpdateExpression = '';
  }

  parseFilterExpression(query, expAttNames) {
    const returnObj = {
      ExpressionAttributeNames: expAttNames,
      ExpressionAttributeValues: {},
      FilterExpression: ''
    };

    // Handle filter expression
    Object.keys(query).forEach((k) => {
      // Handle special case where key name starts with an underscore
      let keyName = (k === '_id') ? 'id' : k;

      // TODO: SUPPORT TEXT SEARCH
      if (keyName === '$text') {
        throw new M.NotImplementedError('Text search is currently not supported.');
      }

      // Handle case where searching nested object
      if (keyName.includes('.')) {
        const split = keyName.split('.');
        split.forEach((s) => {
          const kName = (s === '_id') ? 'id' : s;
          // Add key to ExpressionAttributeNames
          returnObj.ExpressionAttributeNames[`#${kName}`] = s;
        });
        keyName = split.join('.#');
      }
      else {
        // Add key to ExpressionAttributeNames
        returnObj.ExpressionAttributeNames[`#${keyName}`] = k;
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
            returnObj.ExpressionAttributeValues[`:${valueKey}${i}`] = { S: arr[i] };

            // If FilterExpression is empty, init it
            if (!returnObj.FilterExpression && !filterString) {
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
          returnObj.FilterExpression += filterString;
        }
      }
      else {
        switch (typeof query[k]) {
          case 'string':
            returnObj.ExpressionAttributeValues[`:${valueKey}`] = { S: query[k] };
            break;
          case 'boolean':
            returnObj.ExpressionAttributeValues[`:${valueKey}`] = { BOOL: query[k] };
            break;
          case 'number':
            returnObj.ExpressionAttributeValues[`:${valueKey}`] = {
              N: query[k].toString()
            };
            break;
          default: {
            throw new M.DatabaseError(
              `Query param type [${typeof query[k]}] is not supported`, 'critical'
            );
          }
        }

        // Handle special case where searching an array of permissions
        if (keyName.startsWith('permissions.')) {
          // If FilterExpression is not defined yet, define it
          if (returnObj.FilterExpression === '') {
            returnObj.FilterExpression = `contains (#${keyName}, :${valueKey})`;
          }
          else {
            // Append on condition
            returnObj.FilterExpression += ` AND  contains (#${keyName}, :${valueKey})`;
          }
        }
        // If FilterExpression is not defined yet, define it
        else if (returnObj.FilterExpression === '') {
          returnObj.FilterExpression = `#${keyName} = :${valueKey}`;
        }
        else {
          // Append on condition
          returnObj.FilterExpression += ` AND #${keyName} = :${valueKey}`;
        }
      }
    });

    return returnObj;
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
          else {
            // Search for the string null, as you cannot store the value null in
            // a string field, and thus 'null' has been made a reserved keyword
            base[key] = { S: 'null' };
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

    return returnArray;
  }

  /**
   * @description Formats a JSON object properly for DynamoDB.
   *
   * @param {object} obj - The object to format.
   *
   * @returns {object} The formatted object, where the keys are the original
   * keys, but the values are objects containing the "type" as a key and the
   * original value as the value. Ex: { hello: { S: 'world' }}.
   */
  keyFormat(obj) {
    switch (typeof obj) {
      case 'string': return { S: obj };
      case 'boolean': return { BOOL: obj };
      case 'number': return { N: obj.toString() };
      case 'object': {
        if (Array.isArray(obj) && obj.every(o => typeof o === 'string')) {
          return { SS: obj };
        }
        else if (Array.isArray(obj)) {
          return { L: obj.map(i => this.keyFormat(i)) };
        }
        else if (obj !== null) {
          const returnObj = { M: {} };
          Object.keys(obj).forEach((k) => {
            returnObj.M[k] = this.keyFormat(obj[k]);
          });
          return returnObj;
        }
        else {
          return { S: 'null' };
        }
      }
      // Undefined or other types
      default: throw new M.ServerError(`Unsupported query type ${typeof obj}.`);
    }
  }

  // TODO: Update function to not use this
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

      const valueKey = (k.includes('.')) ? k.split('.').join('_') : k;

      // Perform operation based on the type of parameter being updated
      this.ExpressionAttributeValues[`:${valueKey}`] = this.keyFormat(filter[k]);

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

  /**
   * @description Creates an array of queries, properly formatted for DynamoDB's
   * batchGetItem() function.
   *
   * @param {object} filter - The filter to parse and form into batchGetItem
   * queries.
   *
   * @returns {object[]} - An array of formatted queries.
   */
  batchGetItem(filter) {
    // Format the filter into a RequestItems object
    const requestItemsKeys = this.parseRequestItemsKeys(filter);
    const queries = [];

    // Create the base query object
    const baseObj = {
      RequestItems: {
        [this.model.TableName]: {
          Keys: []
        }
      }
    };

    // Loop over the number of keys in RequestItemsKeys
    for (let i = 0; i < requestItemsKeys.length / 25; i++) {
      // Grab in batches of 25, this is the max number for DynamoDB
      baseObj.RequestItems[this.model.TableName].Keys = requestItemsKeys
      .slice(i * 25, i * 25 + 25);

      // Add query to array, copying the object to avoid modifying by reference
      queries.push(JSON.parse(JSON.stringify(baseObj)));
    }

    return queries;
  }

  /**
   * @description Creates a query formatted to be used in batchWriteItem calls.
   *
   * @param {object[]} docs - An array of documents to be inserted/deleted.
   * @param {string} operation - The operation being preformed, can either be
   * 'insert' or 'delete'.
   *
   * @returns {object[]} - An array of queries to make.
   */
  batchWriteItem(docs, operation) {
    const queries = [];
    const baseObj = {
      RequestItems: {}
    };
    baseObj.RequestItems[this.model.TableName] = [];

    // Determine if array of PutRequests or DeleteRequests
    const op = (operation === 'insert') ? 'PutRequest' : 'DeleteRequest';

    // Perform in batches of 25, the max number per request
    for (let i = 0; i < docs.length / 25; i++) {
      const batch = docs.slice(i * 25, i * 25 + 25);
      const tmpQuery = JSON.parse(JSON.stringify(baseObj));

      batch.forEach((doc) => {
        if (op === 'PutRequest') {
          const putObj = {
            PutRequest: {
              Item: {}
            }
          };
          putObj.PutRequest.Item = this.model.formatObject(doc);
          tmpQuery.RequestItems[this.model.TableName].push(putObj);
        }
        else {
          const deleteObj = {
            DeleteRequest: {
              Key: { _id: { S: doc._id } }
            }
          };
          tmpQuery.RequestItems[this.model.TableName].push(deleteObj);
        }
      });

      queries.push(tmpQuery);
    }

    return queries;
  }

  getItem(filter) {
    const requestItemsKeys = this.parseRequestItemsKeys(filter);

    return {
      TableName: this.model.TableName,
      Key: requestItemsKeys[0]
    };
  }

  updateItem(filter, doc) {
    this.parseUpdateExpression(doc);
    const requestItemsKeys = this.parseRequestItemsKeys(filter);

    const baseObj = {
      TableName: this.model.TableName,
      ReturnValues: 'ALL_NEW',
      Key: requestItemsKeys[0]
    };

    // Add on the ExpressionAttributeNames if defined
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

  scan(query) {
    const filterObj = this.parseFilterExpression(query, {});
    const baseObj = {
      TableName: this.model.TableName
    };

    // Add on  ExpressionAttributeNames if defined
    if (Object.keys(filterObj.ExpressionAttributeNames).length !== 0) {
      baseObj.ExpressionAttributeNames = filterObj.ExpressionAttributeNames;
    }

    // Add on ExpressionAttributeValues and FilterExpression if defined
    if (filterObj.FilterExpression.length > 0) {
      baseObj.FilterExpression = filterObj.FilterExpression;
    }
    // If no FilterExpression is defined, remove the ExpressionAttributeNames
    else {
      delete baseObj.ExpressionAttributeNames;
    }

    if (Object.keys(filterObj.ExpressionAttributeValues).length !== 0) {
      baseObj.ExpressionAttributeValues = filterObj.ExpressionAttributeValues;
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

/**
 * @description Defines the Model class. Models are used to create documents and
 * to directly manipulate the database. Operations should be defined to perform
 * all basic CRUD operations on the database. The Model class requirements are
 * closely based on the Mongoose.js Model class
 * {@link https://mongoosejs.com/docs/api/model.html} with an important
 * exception, the constructor creates an instance of the model, not a document.
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
   * @param {string} [projection] - A space separated string containing a list
   * of fields to return (or not return).
   * @param {object} [options={}] - The options supplied to the function.
   *
   * @returns {object[]} - An array of properly formatted documents.
   */
  async formatDocuments(documents, projection, options = {}) {
    // Loop through each document
    const promises = [];
    for (let i = 0; i < documents.length; i++) {
      promises.push(this.formatDocument(documents[i], projection, options)
      .then((doc) => {
        documents[i] = doc;
      }));
    }

    // Wait for all promises to complete
    await Promise.all(promises);

    if (options.sort) {
      const order = Object.values(options.sort)[0];
      const key = Object.keys(options.sort)[0];

      // Sort the documents using custom sort function
      documents.sort((a, b) => {
        return a[key] > b[key];
      });

      // If sorting in reverse order, reverse the sorted array
      if (order === -1) {
        documents.reverse();
      }
    }

    // Return modified documents
    return documents;
  }

  /**
   * @description Formats a single document and returns it in the proper format
   * expected in the controllers.
   * @async
   *
   * @param {object} document -  The documents to properly format.
   * @param {string} [projection] - A space separated string containing a list
   * of fields to return (or not return).
   * @param {object} [options={}] - The options supplied to the function.
   * @param {boolean} [recurse=false] - A boolean value which if true, specifies
   * that this function was called recursively.
   *
   * @returns {object} - The properly formatted document.
   */
  async formatDocument(document, projection, options = {}, recurse = false) {
    const promises = [];
    // For each field in the document
    Object.keys(document).forEach((field) => {
      // If the string null, convert to actual value. The value null is allowed
      // in MBEE for strings, but not supported in DynamoDB on a string field
      if (Object.values(document[field])[0] === 'null') {
        document[field][Object.keys(document[field])[0]] = null;
      }

      // If the field type is 'M', meaning a JSON object/map or 'L' meaning a array/list
      if (Object.keys(document[field])[0] === 'M' || Object.keys(document[field])[0] === 'L') {
        const type = Object.keys(document[field])[0];
        // Recursively call this function with the field contents and no options
        promises.push(this.formatDocument(document[field][type], null, {}, true)
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
    if (!recurse && !projection) {
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
    }
    // If a projection is specified
    else if (!recurse && projection) {
      const fields = projection.split(' ');

      // Exclude certain fields from the document
      if (fields.every(s => s.startsWith('-'))) {
        fields.forEach((f) => {
          // Remove leading '-'
          const key = f.slice(1);
          delete document[key];
        });
      }
      // Include only specified fields
      else {
        // Ensure _id is added to fields
        if (!fields.includes('_id')) {
          fields.push('_id');
        }

        // For each field on the document
        Object.keys(document).forEach((f) => {
          // If the field is not desired, delete it
          if (!fields.includes(f)) {
            delete document[f];
          }
        });
      }
    }

    return document;
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
      const query = new Query(this, {});
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
  async deleteIndex(name) {
    try {
      // Connect to the database
      const conn = await connect();

      // Get the table information
      const tableInfo = await conn.describeTable({ TableName: this.TableName }).promise();

      // Get an array of active index names
      const indexNames = (tableInfo.Table.GlobalSecondaryIndexes)
        ? tableInfo.Table.GlobalSecondaryIndexes.map(i => i.IndexName)
        : [];

      // If the index exists
      if (indexNames.includes(name)) {
        // Create update object
        const updateObj = {
          TableName: this.TableName,
          GlobalSecondaryIndexUpdates: [{
            Delete: {
              IndexName: name
            }
          }]
        };

        // Update the table and delete the index
        const result = await conn.updateTable(updateObj).promise();

        // If the result does not show the index is deleting, throw an error
        const deletedIndex = result.TableDescription.GlobalSecondaryIndexes
        .filter(f => f.IndexName === name)[0];
        if (deletedIndex.IndexStatus !== 'DELETING') {
          throw new M.DatabaseError(`Index ${name} may not have been deleted.`);
        }
      }
    }
    catch (error) {
      M.log.verbose(`Failed in ${this.modelName}.deleteIndex().`);
      throw errors.captureError(error);
    }
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
      // Connect to the database
      const conn = await connect();

      // Find all documents which match the provided conditions
      while (more) {
        // Find the max number of documents
        // Create a new DynamoDB query
        const query = new Query(this, options);
        // Get the formatted scan query
        const scanObj = query.scan(conditions);

        // If there is no filter. block from finding all documents to delete
        if (!scanObj.hasOwnProperty('FilterExpression')) {
          more = false;
        }
        else {
          M.log.debug(`DB OPERATION: ${this.TableName} scan`);
          // Find the documents
          const result = await conn.scan(scanObj).promise(); // eslint-disable-line no-await-in-loop
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
      }

      // Format the documents
      docs = await this.formatDocuments(docs, null, options);

      // Create a new query object
      const query = new Query(this, options);
      // Get the formatted batchWriteItem query, used for deletion
      const deleteQueries = query.batchWriteItem(docs, 'delete');

      const promises = [];

      // For each delete query
      deleteQueries.forEach((q) => {
        // Perform the batchWriteItem operation
        promises.push(conn.batchWriteItem(q, options).promise());
      });

      // Wait for all batchWriteItem operations to complete
      await Promise.all(promises);

      // Return an object specifying the success of the delete operation
      return { n: docs.length, ok: 1 };
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
      let docs = [];
      let limit;
      let skip;
      if (options) {
        limit = options.limit;
        skip = options.skip;
        delete options.limit;
        delete options.skip;
      }
      else {
        options = {}; // eslint-disable-line no-param-reassign
      }

      // Connect to the database
      const conn = await connect();

      // Use batchGetItem only iff the only parameter being searched is the _id
      if (Object.keys(filter).length === 1 && Object.keys(filter)[0] === '_id') {
        // Create the new query object
        const query = new Query(this, options);
        // Get an array of properly formatted batchGetItem queries
        const queriesToMake = query.batchGetItem(filter);

        const promises = [];
        // For each query
        queriesToMake.forEach((q) => {
          // Log the database operation
          M.log.debug(`DB OPERATION: ${this.TableName} batchGetItem`);
          // Append operation to promises array
          promises.push(
            // Make the batchGetItem request
            conn.batchGetItem(q).promise()
            .then((found) => {
              // Append the found documents to the function-global array
              docs = docs.concat(found.Responses[this.TableName]);
            })
          );
        });

        // Wait for completion of all promises
        await Promise.all(promises);
      }
      else {
        let more = true;

        // Find all documents which match the query
        while (more) {
          // Create a new DynamoDB query
          const query = new Query(this, options);
          // Get the formatted scan query
          const scanObj = query.scan(filter);

          M.log.debug(`DB OPERATION: ${this.TableName} scan`);
          // Find the documents
          const result = await conn.scan(scanObj).promise(); // eslint-disable-line

          // Append found documents to the running array
          docs = docs.concat(result.Items);

          // If the skip and/or limit options are provided
          if (limit || skip) {
            // If only the skip option is provided
            if (skip && !limit) {
              // If all of the documents have been found
              if (!result.LastEvaluatedKey) {
                // Remove the first documents, equal to number of options.skip
                docs = docs.slice(skip);
                more = false;
              }
            }
            // If only the limit option is provided
            else if (limit && !skip) {
              // If the correct number or all documents found
              if (docs.length >= limit || !result.LastEvaluatedKey) {
                docs = docs.slice(0, limit);
                more = false;
              }
            }
            // Both the limit and skip options provided
            else if (skip + limit <= docs.length || !result.LastEvaluatedKey) {
              docs = docs.slice(skip).slice(0, limit);
              more = false;
            }
          }
          // If there are no more documents to find, exit loop
          else if (!result.LastEvaluatedKey) {
            more = false;
          }

          // Set LastEvaluatedKey, used to paginate
          options.LastEvaluatedKey = result.LastEvaluatedKey;
        }
      }

      // Format and return the documents
      return await this.formatDocuments(docs, projection, options);
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
      let doc;
      // Loop through each field in the conditions object
      Object.keys(conditions).forEach((key) => {
        // If the field is not indexed, set allIndexed to false
        if ((!this.definition[key].hasOwnProperty('index')
          || this.definition[key].index === false)
          && key !== '_id') {
          allIndexed = false;
        }
      });

      // Connect to the database
      const conn = await connect();
      // Create a new query object
      const query = new Query(this, options);

      // If all fields are indexed, use getItem as it will be significantly faster
      if (allIndexed) {
        // Get a formatted getItem query
        const getObj = query.getItem(conditions);

        // Make the getItem request
        M.log.debug(`DB OPERATION: ${this.TableName} getItem`);
        const result = await conn.getItem(getObj).promise();

        // If document was found, set it
        if (Object.keys(result).length !== 0) {
          doc = result.Item;
        }
      }
      // Not all fields have indexes, use scan to find the document
      else {
        // Get the formatted scan query
        const scanObj = query.scan(conditions);

        // Make the scan request
        M.log.debug(`DB OPERATION: ${this.TableName} scan`);
        const result = await conn.scan(scanObj).promise();

        // If there were documents found, return the first one
        if (Array.isArray(result.Items) && result.Items.length !== 0) {
          doc = this.formatDocument(result.Items[0], projection, options);
        }
      }

      // Return the formatted document or null
      return (doc) ? this.formatDocument(doc, projection, options) : null;
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
      // If only a single document, add to array
      if (!Array.isArray(docs)) {
        docs = [docs]; // eslint-disable-line no-param-reassign
      }
      // Format and validate documents
      const formattedDocs = docs.map(d => this.validate(d));

      // Create a query, searching for existing documents by _id
      const findQuery = { _id: { $in: docs.map(d => d._id) } };
      // Attempt to find any existing documents
      const conflictingDocs = await this.find(findQuery, null, options);

      // If documents with matching _ids exist, throw an error
      if (conflictingDocs.length > 0) {
        throw new M.PermissionError('Documents with the following _ids already'
          + `exist: ${conflictingDocs.map(d => utils.parseID(d._id).pop())}.`, 'warn');
      }
      else {
        const promises = [];

        // Connect to the database
        const conn = await connect();

        // Create a new query object
        const query = new Query(this, options);
        // Get the formatted batchWriteItem queries
        const batchWriteQueries = query.batchWriteItem(formattedDocs, 'insert');

        // For each query
        batchWriteQueries.forEach((q) => {
          // Perform the batchWriteItem operation
          promises.push(conn.batchWriteItem(q).promise());
        });

        // Wait for batchWriteItem operations to complete
        await Promise.all(promises);
      }

      // Find and return the newly created documents
      return await this.find(findQuery, null, options);
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
              // console.log(obj[key])
              returnObj[key] = { L: obj[key].map(o => this.formatObject(o)) };
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
   * @description Updates multiple documents matched by the filter with the same
   * changes in the provided doc.
   * @async
   *
   * @param {object} filter - An object containing parameters to filter the
   * find query by.
   * @param {object} doc - The object containing updates to the found documents.
   * @param {object} [options] - An object containing options.
   * @param {Function} [cb] - A callback function to run.
   *
   * @returns {object} Query containing information about the number of
   * documents which matched the filter (n) and the number of documents which
   * were modified (nModified).
   */
  async updateMany(filter, doc, options, cb) {
    try {
      // Find each document which matches the filter
      const docs = await this.find(filter, null, options);

      const promises = [];
      // For each document found
      docs.forEach((d) => {
        // Create a query for find one, which should find a single document
        const q = { _id: d._id };
        // Update the document with the specified changes
        promises.push(this.updateOne(q, doc));
      });

      // Wait for all promises to complete
      await Promise.all(promises);

      // Return a query with update info
      return { n: docs.length, nModified: docs.length };
    }
    catch (error) {
      throw errors.captureError(error);
    }
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
      const query = new Query(this, options);
      // Get the properly formatted updateItem query
      const updateObj = query.updateItem(filter, doc);

      // Connect to the database
      const conn = await connect();

      M.log.debug(`DB OPERATION: ${this.TableName} updateItem`);
      // Update the single item
      const updatedItem = await conn.updateItem(updateObj).promise();
      // Return the properly formatted, newly updated document
      return await this.formatDocument(updatedItem.Attributes, null, options);
    }
    catch (error) {
      M.log.verbose(`Failed in ${this.modelName}.updateOne().`);
      throw errors.captureError(error);
    }
  }

  /**
   * @description Validates a document which is to be inserted into the
   * database. Sets any default fields which are not provided in the original
   * document.
   *
   * @param {object} doc - The document to be inserted into the database.
   *
   * @returns {object} The validated document, with default values set if they
   * were not specified in the original document.
   */
  validate(doc) {
    const keys = Object.keys(doc);

    // Loop over each valid parameter in the definition
    Object.keys(this.definition).forEach((param) => {
      // If a default exists and the value isn't set, and no specific fields are provided
      if (this.definition[param].hasOwnProperty('default') && !keys.includes(param)) {
        // If the default is a function, call it
        if (typeof this.definition[param].default === 'function') {
          doc[param] = this.definition[param].default();
        }
        else if (this.definition[param].default === '') {
          // Do nothing, empty strings cannot be saved in DynamoDB
        }
        else {
          // Set the value equal to the default
          doc[param] = this.definition[param].default;
        }
      }

      // Parameter was defined on the document
      if (keys.includes(param)) {
        // Validate type
        let shouldBeType;
        switch (this.definition[param].type) {
          case 'S':
            shouldBeType = 'string'; break;
          case 'N':
            shouldBeType = 'number'; break;
          case 'M':
            shouldBeType = 'object'; break;
          case 'BOOL':
            shouldBeType = 'boolean'; break;
          default:
            throw new M.DataFormatError(`Invalid DynamoDB type: ${this.definition[param].type}`);
        }

        // If validators are defined on the field
        if (this.definition[param].hasOwnProperty('validate')) {
          // For each validator defined
          this.definition[param].validate.forEach((v) => {
            // Call the validator, binding the document to "this"
            if (!v.validator.call(doc, doc[param])) {
              // If the validator fails, throw an error
              throw new M.DataFormatError(`${this.modelName} validation failed: `
                + `${param}: ${v.message({ value: doc[param] })}`);
            }
          });
        }

        // If not the correct type, throw an error
        if (typeof doc[param] !== shouldBeType // eslint-disable-line valid-typeof
          && !(shouldBeType !== 'object' && doc[param] === null)) {
          throw new M.DataFormatError(`${this.modelName} validation failed: `
            + `${param}: Cast to ${utils.toTitleCase(shouldBeType)} failed `
            + `for value "${JSON.stringify(doc[param])}" at path "${param}"`);
        }

        // If an array of enums exists, and the value is not in it, throw an error
        if (this.definition[param].hasOwnProperty('enum')
          && !this.definition[param].enum.includes(doc[param])) {
          throw new M.DataFormatError(`${this.modelName} validation failed: `
            + `${param}: \`${doc[param]}\` is not a valid enum value for path`
            + ` \`${param}\`.`);
        }

        // Handle special case where the field should be a string, and defaults to null
        if (this.definition[param].hasOwnProperty('default')
          && this.definition[param].default === null && doc[param] === null) {
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
      else if (this.definition[param].required
        && !this.definition[param].hasOwnProperty('default')) {
        let message = `Path \`${param}\` is required.`;
        // If required is an array, grab the error message (second entry)
        if (Array.isArray(this.definition[param].required)
          && this.definition[param].required.length === 2) {
          message = this.definition[param].required[1];
        }
        throw new M.DataFormatError(`${this.modelName} validation failed: `
          + `${param}: ${message}`);
      }
    });

    return doc;
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
