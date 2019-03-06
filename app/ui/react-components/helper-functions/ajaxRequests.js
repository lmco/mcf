/**
 * Classification: UNCLASSIFIED
 *
 * @module ui.react-components.helper-functions
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license LMPI - Lockheed Martin Proprietary Information
 *
 * @owner Leah De Laurell <leah.p.delaurell@lmco.com>
 *
 * @author Jake Ursetta <jake.j.ursetta@lmco.com>
 * @author Leah De Laurell <leah.p.delaurell@lmco.com>
 *
 * @description This implements the jQuery to do a get request to the api
 * and return the data if passed or reject with an error.
 */

export function ajaxRequest(method, url, data, dataType) {
  // Declare promise
  return new Promise((resolve, reject) => {
    // Execute javascript query
    /* eslint-disable no-undef */
    jQuery.ajax({
      // Specify method
      method: method,
      // Specify URL, data type, and data
      url: url,
      dataType: dataType || 'json',
      data: data || '',
      // Request succeeded, resolve the data
      success: (retData) => resolve(retData),
      // Request failed, reject error
      error: (err) => reject(err)
    });
  });
}
