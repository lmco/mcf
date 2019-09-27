/**
 * @classification UNCLASSIFIED
 *
 * @module test.7xx_ui_tests.set-up
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license LMPI - Lockheed Martin Proprietary Information
 *
 * @owner Leah De Laurell <leah.p.delaurell@lmco.com>
 *
 * @author Leah De Laurell <leah.p.delaurell@lmco.com>
 *
 * @description This file creates a fake virtual DOM
 * and configures the enzyme adaptor for UI testing.
 */
// NPM modules
const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');
import { configure } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';

// Configure enzyme adaptor
configure({ adapter: new Adapter() });

// Node modules
const jquery = fs.readFileSync(path.join(M.root, 'node_modules', 'jquery', 'dist', 'jquery.min.js'), { encoding: 'utf-8' });
const jqueryUI = fs.readFileSync(path.join(M.root, 'node_modules', 'jquery-ui-dist', 'jquery-ui.min.js'), { encoding: 'utf-8' });

// MBEE modules
const mbee = fs.readFileSync(path.join(M.root, 'app', 'ui', 'js', 'mbee.js'), { encoding: 'utf-8' });
const url = 'http://localhost:6233';

// Initialize JSDOM
const options = {
  url: url,
  resources: 'usable',
  runScripts: 'dangerously'
};
const html = '<!doctype html>'
  + '<html lang="en">'
  + '<head>'
  + '  <meta charset="utf-8">'
  + '  <title></title>'
  + '</head>'
  + '<body>'
  + '  <div id="main"></div>'
  + '</body>'
  + '</html>';
const jsdom = new JSDOM(html, options);
const { window } = jsdom;

// Adding necessary scripts to jsdom
const scriptJQuery = window.document.createElement('script');
scriptJQuery.textContent = jquery;
window.document.body.appendChild(scriptJQuery);
const scriptJQueryUI = window.document.createElement('script');
scriptJQueryUI.textContent = jqueryUI;
window.document.body.appendChild(scriptJQueryUI);
const scriptMBEE = window.document.createElement('script');
scriptMBEE.textContent = mbee;
window.document.body.appendChild(scriptMBEE);

/**
 * @description Copying properties to object.
 *
 * @param {object} src - The source object.
 * @param {object} target - The target object.
 */
function copyProps(src, target) {
  Object.defineProperties(target, {
    ...Object.getOwnPropertyDescriptors(src),
    ...Object.getOwnPropertyDescriptors(target)
  });
}

// Globally defining jquery, window, and document
global.$ = require('jquery')(window);
global.window = window;
global.document = window.document;

// Exposing global properties if undefined
const exposedProperties = ['window', 'navigator', 'document'];
Object.keys(document.defaultView).forEach((property) => {
  if (typeof global[property] === 'undefined') {
    exposedProperties.push(property);
    global[property] = document.defaultView[property];
  }
});

global.navigator = {
  userAgent: 'mocha'
};

// Setting timeout for animation frame
global.requestAnimationFrame = function(callback) {
  return setTimeout(callback, 0);
};

// Clearing timeout for animation frame
global.cancelAnimationFrame = function(id) {
  clearTimeout(id);
};

copyProps(window, global);
