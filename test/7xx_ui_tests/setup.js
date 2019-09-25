/**
 * Classification: UNCLASSIFIED
 *
 * @module test.7xx_ui_tests.setup
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license LMPI - Lockheed Martin Proprietary Information
 *
 * @owner Leah De Laurell <leah.p.delaurell@lmco.com>
 *
 * @author Leah De Laurell <leah.p.delaurell@lmco.com>
 *
 * @description This is a helper file that sets up the fake dom
 * that the UI tests will render on.
 */
const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');
const mbee = fs.readFileSync(path.join(M.root, 'app', 'ui', 'js', 'mbee.js'), { encoding: "utf-8" });
const jquery = fs.readFileSync(path.join(M.root, 'node_modules', 'jquery', 'dist', 'jquery.min.js'), { encoding: "utf-8" });
const jqueryUI = fs.readFileSync(path.join(M.root, 'node_modules', 'jquery-ui-dist', 'jquery-ui.min.js'), { encoding: "utf-8" });
const index = fs.readFileSync(path.join(M.root, 'test', '7xx_ui_tests', 'index.html'));
const options = {
  url: 'http://localhost:6233',
  resources: 'usable',
  runScripts: 'dangerously'
};
const html = index.toString();

const jsdom = new JSDOM(html, options);
const { window } = jsdom;

const scriptJQuery = window.document.createElement("script");
scriptJQuery.textContent = jquery;
window.document.body.appendChild(scriptJQuery);
const scriptJQueryUI = window.document.createElement("script");
scriptJQueryUI.textContent = jqueryUI;
window.document.body.appendChild(scriptJQueryUI);
const scriptEl = window.document.createElement("script");
scriptEl.textContent = mbee;
window.document.body.appendChild(scriptEl);

function copyProps(src, target) {
  Object.defineProperties(target, {
    ...Object.getOwnPropertyDescriptors(src),
    ...Object.getOwnPropertyDescriptors(target),
  });
}

global.$ = require('jquery')(window);
global.window = window;
global.document = window.document;
const exposedProperties = ['window', 'navigator', 'document'];
Object.keys(document.defaultView).forEach((property) => {
  if (typeof global[property] === 'undefined') {
    exposedProperties.push(property);
    global[property] = document.defaultView[property];
  }
});
global.navigator = {
  userAgent: 'node.js',
};
global.requestAnimationFrame = function (callback) {
  return setTimeout(callback, 0);
};
global.cancelAnimationFrame = function (id) {
  clearTimeout(id);
};
copyProps(window, global);
