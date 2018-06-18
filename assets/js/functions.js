"use strict";

const path = require('path');

module.exports.htmlPath = function htmlPath(filename) {
    return path.join(__dirname, '..', 'html', filename+'.html');
}