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

const path = require('path');
const package_json = require(path.join(__dirname, '..', '..', 'package.json'));
const config = package_json['mbee-config'];

/**
 * APIController.js
 *
 * @author  Josh Kaplan <joshua.d.kaplan@lmco.com>
 *
 * Defines API-related control functionality.
 */
class APIController 
{

    /**
     * Returns the version number as JSON.
     */
    static version(req, res) 
    {
        var obj = {'version': package_json['version']};
        return res.send(APIController.formatJSON(obj));
    }


    /**
     * Renders the swagger doc.
     */
    static swaggerDoc(req, res) 
    {
        return res.render('swagger', {
            swagger: APIController.swaggerSpec()
        });
    }


    /**
     * Returns the swagger JSON spec.
     */
    static swaggerJSON(req, res)
    {
        var swaggerSpec = APIController.swaggerSpec();
        res.header('Content-Type', 'application/json');
        return res.status(200).send(APIController.formatJSON(swaggerSpec));
    }


    /**
     * 
     */
    static swaggerSpec() 
    {
        var swaggerJSDoc = require('swagger-jsdoc');
        return swaggerJSDoc({
            swaggerDefinition: {
                info: {
                    title:  'MBEE API Documentation',    // Title (required)
                    version: package_json['version'],    // Version (required)
                },
            },
            apis: [
                path.join(__dirname, '..', 'api_routes.js')  // Path to the API docs
            ], 
        });
    }


    /**
     * Formats an object as JSON. This method should be used for all API JSON
     * formatting to provide common formatting across the API.
     */
    static formatJSON(obj) 
    {
        return JSON.stringify(obj, null, config.server.json.indent);
    }


    /**
     * A helper method for defining a route that is not yet implemented.
     */
    static notImplemented(req, res)
    {
        return res.status(501).send('Not Implemented.');
    } 

}


module.exports = APIController;
