/**
 * Classification: UNCLASSIFIED
 *
 * @module test.set-up
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
import { configure } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';

// Initialize fake virtual DOM
const jsdom = new JSDOM('<!doctype html><html><body></body></html>');
const { window } = jsdom;

// Configure enzyme adaptor
configure({ adapter: new Adapter() });

// Initialize testing document and window variables
function copyProps(src, target) {
  Object.defineProperties(target, {
    ...Object.getOwnPropertyDescriptors(src),
    ...Object.getOwnPropertyDescriptors(target),
  });
}

global.window = window;
global.document = window.document;
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
