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
 * @module  lib/startup
 *
 * @author Josh Kaplan <joshua.d.kaplan@lmco.com>
 *
 * Prints an MBEE startup logo.
 */

var colors = {
    'grey': '\u001b[30m',
    'red': '\u001b[31m',
    'green': '\u001b[32m',
    'yellow': '\u001b[33m',
    'blue': '\u001b[34m',
    'magenta': '\u001b[35m',
    'cyan': '\u001b[36m',
    'light_grey': '\u001b[37m',
    'esc': '\u001b[39m'
}
var primary = colors['green'];
var secondary = colors['grey'];

var logo = {};
logo['1'] = primary + '███' + secondary + '╗' + primary
            + '   ███' + secondary + '╗' + primary + '██████' + secondary + '╗' 
            + primary + ' ███████' + secondary + '╗' + primary + '███████' + secondary + '╗' 
            + colors['esc'];
logo['2'] = primary + '████' + secondary + '╗' + primary + ' ████' 
            + secondary + '║' + primary + '██' + secondary + '╔══' + primary 
            + '██' + secondary + '╗' + primary + '██' + secondary + '╔════╝'
            + primary + '██' + secondary + '╔════╝' + colors['esc'];
logo['3'] = primary + '██' + secondary + '╔' + primary + '████' + secondary 
            + '╔' + primary + '██' + secondary + '║' + primary + '██████' 
            + secondary + '╔╝' + primary + '█████' + secondary + '╗' 
            + primary + '  █████' + secondary + '╗  ' 
            + colors['esc'];
logo['4'] = primary + '██' + secondary + '║╚' + primary + '██' + secondary + '╔╝' 
            + primary + '██' + secondary + '║' + primary + '██' + secondary + '╔══' 
            + primary + '██' + secondary + '╗' + primary + '██' + secondary + '╔══╝  ' 
            + primary + '██' + secondary + '╔══╝  ' 
            + colors['esc'];
logo['5'] = primary + '██' + secondary + '║ ╚═╝ ' + primary + '██' + secondary 
            + '║' + primary + '██████' + secondary + '╔╝' + primary + '███████' 
            + secondary + '╗' + primary + '███████' + secondary + '╗' 
            + colors['esc'];
logo['6'] = secondary + '╚═╝     ╚═╝╚═════╝ ╚══════╝╚══════╝' 
            + colors['esc'];

var image = {};
image['1'] = '\u001b[33m';
image['2'] = '              \u001b[30m\\     /\u001b[39m                  ';
image['3'] = '          \u001b[30m\\\u001b[39m    o \u001b[33m^\u001b[39m o    \u001b[30m/\u001b[39m              ';
image['4'] = '            \u001b[30m\\\u001b[39m \u001b[33m(     ) \u001b[30m/\u001b[39m                ';
image['5'] = '\u001b[39m ____________\u001b[33m(%%%%%%%)\u001b[39m____________     ' + logo['1'];
image['6'] = '(     /   /  )\u001b[33m%%%%%%%\u001b[39m(  \\   \\     )    ' + logo['2'];
image['7'] = '(___/___/__/           \\__\\___\\___)    ' + logo['3'];
image['8'] = '   (     /  /\u001b[33m(%%%%%%%)\u001b[39m\\  \\     )       ' + logo['4'];
image['9'] = '    (__/___/ \u001b[33m(%%%%%%%)\u001b[39m \\___\\__)        ' + logo['5'];
image['10'] = '            \u001b[30m/\u001b[33m(       )\u001b[39m\u001b[30m\\\u001b[39m                ' + logo['6'];
image['11'] = '          \u001b[30m/   \u001b[33m(%%%%%)\u001b[39m   \u001b[30m\\\u001b[39m              ';
image['12'] = '               \u001b[33m(%%%)\u001b[39m                   ';
image['13'] = '                 \u001b[33m!\u001b[39m                     ';
image['14'] = '\u001b[39m';

function print_logo() {
    console.log(image['1']);
    console.log(image['2']);
    console.log(image['3']);
    console.log(image['4']);
    console.log(image['5']);
    console.log(image['6']);
    console.log(image['7']);
    console.log(image['8']);
    console.log(image['9']);
    console.log(image['10']);
    console.log(image['11']);
    console.log(image['12']);
    console.log(image['13']);
    console.log(image['14']);
}

module.exports = print_logo;
