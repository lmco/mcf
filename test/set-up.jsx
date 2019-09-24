// /**
//  * Classification: UNCLASSIFIED
//  *
//  * @module test.set-up
//  *
//  * @copyright Copyright (C) 2018, Lockheed Martin Corporation
//  *
//  * @license LMPI - Lockheed Martin Proprietary Information
//  *
//  * @owner Leah De Laurell <leah.p.delaurell@lmco.com>
//  *
//  * @author Leah De Laurell <leah.p.delaurell@lmco.com>
//  *
//  * @description This file creates a fake virtual DOM
//  * and configures the enzyme adaptor for UI testing.
//  */
// // NPM modules
// const { JSDOM } = require('jsdom');
// import { configure } from 'enzyme';
// import Adapter from 'enzyme-adapter-react-16';
//
// const options = {
//   resources: 'usable',
//   runScripts: 'dangerously',
// };
//
// let jsdom;
//
// JSDOM.fromFile('index.html', options).then((dom) => {
//   jsdom = dom;
//   console.log(jsdom);
//
//   // const jsdom = new JSDOM('<!doctype html><body><script type="text/javascript" src="../app/ui/js/mbee.js"></script></body></html>');
//   const { window } = jsdom;
//   global.$ = require('jquery')(window);
//
//   // Configure enzyme adaptor
//   configure({ adapter: new Adapter() });
//
//   // Initialize testing document and window variables
//   function copyProps(src, target) {
//     Object.defineProperties(target, {
//       ...Object.getOwnPropertyDescriptors(src),
//       ...Object.getOwnPropertyDescriptors(target),
//     });
//   }
//
//   global.window = window;
//   global.document = window.document;
//   global.navigator = {
//     userAgent: 'node.js',
//   };
//   global.requestAnimationFrame = function (callback) {
//     return setTimeout(callback, 0);
//   };
//   global.cancelAnimationFrame = function (id) {
//     clearTimeout(id);
//   };
//   copyProps(window, global);
// });
// JSDOM.env({
//     html: '<!doctype html><body></body></html>',
//     documentRoot: __dirname + '/app' + '/ui' + '/js',
//     scripts: [
//       'mbee.js'
//     ]
//   }, function (err, window) {
//   }
// );
