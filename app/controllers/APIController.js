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
const config = require(path.join(__dirname, '..', '..', 'config.json'))

/**
 * APIController.js
 *
 * Josh Kaplan <joshua.d.kaplan@lmco.com>
 *
 * Defines UI-related control functionality.
 */
class APIController 
{

    /**
     * Returns the version number as JSON.
     */
    static version(req, res) 
    {
        return res.send(
            JSON.stringify({'version': '0.1.0'}, null, config.server.json.indent)
        );
    }

}

module.exports = APIController;