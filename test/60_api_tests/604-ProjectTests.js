/*****************************************************************************
 * Classification: UNCLASSIFIED                                              *
 *                                                                           *
 * Copyright (C) 2018, Lockheed Martin Corporation                           *
 *                                                                           *
 * LMPI WARNING: This file is Lockheed Martin Proprietary Information.       *
 * It is not approved for public release or redistribution.                  *
 *                                                                           *
 * EXPORT CONTROL WARNING: This software may be subject to applicable export *
 * control laws. Contact legal and export compliance prior to distribution.  *
 *****************************************************************************/
/**
 * @module  TestAPIBasic.js
 *
 * @author  Leah De Laurell <leah.p.delaurell@lmco.com>
 *
 * Tests Basic API functionality with Projects.
 */

const path = require('path');
const chai  = require('chai');
const request = require('request');

const fname = module.filename;
const name = fname.split('/')[fname.split('/').length - 1];
const M = require(path.join(__dirname, '..', '..', 'mbee.js'));
const Org = M.load('models/Organization');


const package_json = require(path.join(__dirname,'..', '..', 'package.json'));
const config = package_json['config'];
const test = M.config.test;
const User = M.load('models/User');

/**
 * APIProjectTest
 *
 * @author Leah De Laurell <leah.p.delaurell@lmco.com>
 *
 */

/*------------------------------------
 *       Main
 *------------------------------------*/
let org = null; 
let user = null;
  // runs before all tests in this block

describe(name, () => {
    before(() => {
        db = M.load('lib/db');
        db.connect()
        console.log('before promise');
        return new Promise((resolve) => {
            User.findOne({username : 'mbee'}, function(err, foundUser){
              user = foundUser;
              // Check if error occured
              if (err) {
                M.log.error(err);
              }
              // Otherwise,
              // Create a parent organization before creating any projects
              org = new Org({
                id: 'hogwarts',
                name: 'Gryffindor',
                permissions: {
                  admin: [user._id],
                  write: [user._id],
                  read: [user._id]
                }
              });
              console.log('before save');
              org.save((err) => {
                if (err) {
                  M.log.error(err);
                }
                console.log(org);
                resolve();
              });
            });
        });
      });
      //runs after all the tests are done
      after(() => {
          Org.findOneAndRemove({ id: 'hogwarts' }, (err) => {
            if (err) {
              M.log.error(err);
            }
            chai.assert(err === null);
            mongoose.connection.close();
          });
      });

    it('should POST a project to the organization', postProject01);
    it('should DELETE a project to the organziation', deleteProject01);
});

  /**---------------------------------------------------
   *            Test Functions
   ----------------------------------------------------*/

     /**
      * Makes a POST request to /api/orgs/:orgid/projects/:projectid to create a project.
      * This should succeed.
      */
     function postProject01(done)
     {
         var id = 'harrypotter';
         request({
             url:        `${test.url}/api/orgs/hogwarts/projects/harrypotter`,
             headers:    getHeaders(),
             method:     'POST',
             body:       JSON.stringify({
                 "id": id,
                 "name":   'Youre a wizard Harry',
                 "org" : org._id,
                 "permissions": { 
                   "admin": [user._id],
                   "write": [user._id], 
                   "read": [user._id] 
                },
                 uid: `${id}:${org.id}`  
             })
         },
         function(error, response, body) {
             console.log(body);
             var json = JSON.parse(body);
             chai.expect(response.statusCode).to.equal(200);
             chai.expect(json['id']).to.equal('harrypotter');
             chai.expect(json['name']).to.equal('Youre a wizard Harry');
             done();
         });
     }

     /**
      * Makes a DELETE request to /api/orgs/:orgid/projects/:projectid to remove a project.
      * This should succeed.
      */
     function deleteProject01(done)
     {
         request({
             url:        `${test.url}/api/orgs/hogwarts/projects/harrypotter`,
             headers:    getHeaders(),
             method:     'DELETE'
         },
         (error, response, body) => {
             chai.expect(response.statusCode).to.equal(200);
             done();
         });
     }



  /*----------( Helper Functions )----------*/

 /**
  * Produces and returns an object containing common request headers.
  */
 function getHeaders()
 {
     return {
         'Content-Type': 'application/json',
         authorization: 'Basic '+Buffer.from(`${M.config.test.username}:${M.config.test.password}`).toString('base64')
     }
 }