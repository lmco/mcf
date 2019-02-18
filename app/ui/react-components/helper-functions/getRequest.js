/**
 * Classification: UNCLASSIFIED
 *
 * @module  ui.react-components.helper-functions
 *
 * @copyright Copyright (C) 2019, Lockheed Martin Corporation
 *
 * @license LMPI - Lockheed Martin Proprietary Information
 *
 * LMPI WARNING: This file is Lockheed Martin Proprietary Information.
 * It is not approved for public release or redistribution.
 *
 * EXPORT CONTROL WARNING: This software may be subject to applicable export
 * control laws. Contact legal and export compliance prior to distribution.
 *
 * @owner Leah De Laurell <leah.p.delaurell@lmco.com>
 *
 * @author Jake Ursetta <jake.j.ursetta@lmco.com>
 *
 * @description This implements the jQuery to do a get request to the api
 * and return the data if passed or reject with an error.
 */
export function getRequest(url, dataType) {
  // Declare promise
  return new Promise((resolve, reject) => {
    // Execute javascript query
    jQuery.ajax({   // eslint-disable-line no-undef
      // Specify URL and data type
      url: url,
      dataType: dataType || 'json',
      // Request succeeded, resolve the data
      success: (data) => resolve(data),
      // Request failed, reject error
      error: (err) => reject(err)
    });
  });
}
