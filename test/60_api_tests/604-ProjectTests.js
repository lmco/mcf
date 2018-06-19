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
const util = require('util');
const chai  = require('chai');
const request = require('request');

const fname = module.filename;
const name = fname.split('/')[fname.split('/').length - 1];
const M = require(path.join(__dirname, '..', '..', 'mbee.js'));
const Org = M.load('models/Organization');


const package_json = require(path.join(__dirname,'..', '..', 'package.json'));
const config = package_json['config'];
const test = M.config.test;

/**
 * APIProjectTest
 *
 * @author Leah De Laurell <leah.p.delaurell@lmco.com>
 *
 */

/*------------------------------------
 *       Main
 *------------------------------------*/

describe(name, () => {
    // runs before all tests in this block
    before(() => {
      const db = M.load('lib/db');
      db.connect();
  
      // Create a parent organization before creating any projects
      org = new Org({
        id: 'hogwarts',
        name: 'Gryffindor'
      });
      org.save((err) => {
        if (err) {
          M.log.error(err);
        }
       chai.expect(err).to.equal(null);
      });
    });
  
    // runs after all tests in this block
    after(() => {
      Org.findOneAndRemove({ id: org.id }, (err) => {
        if (err) {
          M.log.error(err);
        }
        chai.expect(err).to.equal(null);
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
         request({
             url:        `${test.url}/api/orgs/hogwarts/projects/harrypotter`,
             headers:    getHeaders(),
             method:     'POST',
             body:       JSON.stringify({
                 "id": 'harrypotter',
                 "name":   'Youre a wizard Harry'
             })
         },
         function(error, response, body) {
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