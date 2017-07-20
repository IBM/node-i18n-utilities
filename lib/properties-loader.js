/*******************************************************************************
 * Licensed Materials - Property of IBM
 * (c) Copyright IBM Corporation 2015, 2016. All Rights Reserved.
 *
 * Note to U.S. Government Users Restricted Rights:
 * Use, duplication or disclosure restricted by GSA ADP Schedule
 * Contract with IBM Corp.
 *******************************************************************************/
'use strict';

var i18n = require('node-i18n-util'),
    path = require('path');

var EXTENSION = '.properties';

module.exports = function(source) {
    this.cacheable();
    var context = this.options.context,
        bundlePath = path.relative(context, this.resource);

    // emit one file for each locale
    var bundle = i18n._loadBundle(this.resource, true)._bundle();
    for (var i in bundle) {
        if (i === 'root') {
            if (!isEmpty(bundle.root)) {
                emitLocale.call(this, bundlePath, '', bundle.root);
            }
        } else {
            var lang = bundle[i];
            for (var j in lang) {
                if (j === 'root') {
                    if (!isEmpty(lang.root)) {
                        emitLocale.call(this, bundlePath, '_' + i, lang.root);
                    }
                } else {
                    var country = lang[j];
                    emitLocale.call(this, bundlePath, '_' + i + '_' + j, country);
                }
            }
        }
    }
    this.addDependency(path.resolve('client-bundle.js'));
    return 'module.exports=require("node-i18n-util/lib/client-bundle")("' + bundlePath + '")';
};

/*
 * Emits a .js file corresponding to a flattened set of .properties files for a specific locale,
 * that registers itself as a global in the browser.
 */
function emitLocale(bundlePath, suffix, data) {
    var baseName = bundlePath.substring(0, bundlePath.indexOf(EXTENSION)),
        file = baseName + suffix + '.js',
        flattened = {};
    // JSON stringify doesn't output inherited properties (from more general locales)
    // so we need to flatten out the object before strinfigying it
    for (var i in data) {
        flattened[i] = data[i];
    }
    var preamble = 'window.nls = window.nls || {}; window.nls["' + bundlePath + '"] = ';
    this.emitFile(file, preamble + JSON.stringify(flattened));
}

function isEmpty(obj) {
    for (var i in obj) {
        if (obj.hasOwnProperty(i)) {
            return false;
        }
    }
    return true;
}
