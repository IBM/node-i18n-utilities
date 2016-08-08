/*******************************************************************************
 * Licensed Materials - Property of IBM
 * (c) Copyright IBM Corporation 2014, 2016. All Rights Reserved.
 *
 * Note to U.S. Government Users Restricted Rights:
 * Use, duplication or disclosure restricted by GSA ADP Schedule
 * Contract with IBM Corp.
 *******************************************************************************/
'use strict';

var fs = require('fs'),
    path = require('path'),
    properties = require('./properties');

var ARGS_REGEX = /\{([0-9]+)\}/g,
    ARG_REGEX = /\{0\}/g,
    FILE_EXTENSION = ".properties",
    FILE_REGEX = /([^_]+)(?:_([a-z]{2}))?(?:_([A-Z]{2}))?\.properties/,
    LANGUAGE_TAG_VARIANTS = {
        'zh-Hans': 'zh-CN',
        'zh-Hant': 'zh-TW'
    };

// in-memory bundle hierarchy (filename -> lang -> country -> bundle)
var _bundles = {};

/**
 * Registers an extension with node.js to allow requiring properties files directly.
 * e.g.
 *   var msgs = require('./msgs.properties');
 *   msgs.get('hello');
 *   msgs.get('hello', 'fr-CA');
 *   msgs.get('hello', req);
 */
require.extensions['.properties'] = function(module, filename) {
    // write a module that exports the i18n message bundle
    return module._compile('module.exports = require("i18n")._loadBundle(' + JSON.stringify(filename) + ');', filename);
};

/**
 * Returns the language tag (e.g. 'en', 'en-US') for the given express request, or undefined if no language
 * was requested.
 */
exports.locale = function(req) {
    // get preferred locale from request
    var lang = req.acceptsLanguages()[0];
    if (lang) {
        // normalize variants
        var variant = LANGUAGE_TAG_VARIANTS[lang];
        if (variant) {
            lang = variant;
        }
        // normalize case to aa_BB
        var parts = lang.split('-');
        parts[0] = parts[0].toLowerCase();
        parts[1] && (parts[1] = parts[1].toUpperCase());
        return parts.join('-');
    }
};

/*
 * Ensures that the bundle corresponding to the given properties file is loaded, and returns it.
 */
exports._loadBundle = function(filename, force) {
    if (force || !resolveBundle(filename)) {
        // the filename is the root properties file, e.g. /path/file.properties
        // find and load all translations in that dir, e.g. /path/file_fr.properties, etc.
        var pathObj = path.parse(filename),
            dir = pathObj.dir,
            basename = pathObj.name,
            files = fs.readdirSync(dir);

        // process the root file
        processBundle(filename);

        // process the translations
        for (var i=0,len=files.length;i<len;++i) {
            var file = path.join(dir, files[i]);
            if (!fs.statSync(file).isDirectory()) {
                var matches = FILE_REGEX.exec(files[i]);
                if (matches) {
                    var rootname = matches[1];
                    if (rootname === basename && matches[2]) {
                        processBundle(file);
                    }
                }
            }
        }
        return {
            get: get.bind(null, filename),
            _bundle: _bundle.bind(null, filename)
        };
    }
};

exports._resolveBundle = resolveBundle;

/*
 * Internal method that returns all data for the given bundle, in all locales.
 */
function _bundle(filename) {
    return _bundles[filename];
}

/*
 * Copies all the enumerable properties from b to a.
 */
function extend(a, b) {
    for (var i in b) {
        a[i] = b[i];
    }
    return a;
}

/*
 * Reads the .properties file at the given path and adds it to the bundle registry.
 */
function processBundle(filename) {
    var data;
    try {
        data = properties.loadFileSync(filename);
    } catch (error) {
        console.error('Error loading message bundle ' + filename + ':\n' + error);
        return;
    }
    var pathObj = path.parse(filename),
        dir = pathObj.dir,
        basename = pathObj.base,
        matches = FILE_REGEX.exec(basename),
        basepath = path.join(dir, matches[1] + FILE_EXTENSION),
        lang = matches[2],
        country = matches[3];

    var langs = _bundles[basepath];
    if (!langs) {
        langs = _bundles[basepath] = {root: {}};
    }
    if (lang) {
        var countries = langs[lang];
        if (!countries) {
            countries = langs[lang] = {root: Object.create(langs.root)};
        }
        // use root country if the bundle doesn't specify a country (e.g. messages_en.properties)
        if (country) {
            countries[country] = extend(Object.create(countries.root), data);
        } else {
            extend(countries.root, data);
        }
    } else {
        // use root language if bundle doesn't specify a language (e.g. messages.properties)
        extend(langs.root, data);
    }
}

function resolveArgs(msg, args) {
    if (!Array.isArray(args)) {
        return msg.replace(ARG_REGEX, args);
    } else {
        var argsLen = args.length;
        return msg.replace(ARGS_REGEX, function (p1, p2) {
            var i = parseInt(p2, 10);

            if (i < argsLen) {
                var toReplace = args[i];

                if (toReplace === null || toReplace === undefined) {
                    toReplace = '';
                }

                return toReplace;
            } else {
                return p1;
            }
        });
    }
}

/*
 * Returns the message bundle for the given filename and locale (or request). An object with
 * these properties:
 *
 * - data (object): The bundle data
 * - locale (string?): The matched bundle's locale
 */
function resolveBundle(filename, locale) {
    var parts = typeof locale === 'string' ? locale.split('-') : [],
        lang = parts[0],
        country = parts[1];
    var langs = _bundles[filename];
    if (langs) {
        var countries = langs[lang];
        if (countries) {
            var bundle = countries[country];
            if (bundle) {
                // exact match
                return {
                    data: bundle,
                    locale: lang + '-' + country
                };
            }
            // matched a language bundle with no country
            return {
                data: countries.root,
                locale: lang
            };
        }
        // root bundle
        return {data: langs.root};
    }
}

/*
 * Returns the locale code string for the given locale or request. If it's a request,
 * it gets the locale from the Accept-Language header.
 */
function resolveLocale(localeOrReq) {
    if (localeOrReq) {
        if (typeof localeOrReq === 'object') {
            return exports.locale(localeOrReq);
        }
        return localeOrReq;
    }
}

/*
 * The get function for bundles returned from the bundle() function.
 * - key - {string} The message key
 * - args? - (Optional) {array} An additional arguments array, for variable substitution
 * - localeOrReq? - (Optional) {string | object} The locale or request (default locale if not specified)
 */
function get(path, key, arg2, arg3) {
    // parse args
    var localeOrReq,
        args;
    if (Array.isArray(arg2)) {
        args = arg2;
        localeOrReq = arg3;
    } else {
        localeOrReq = arg2;
    }
    // validate args
    if (typeof(key) !== 'string') {
        throw new Error('Invalid message key ' + key + ' (' + typeof(key) + ')');
    }
    if (key.length === 0) {
        throw new Error('Invalid message key (empty string)');
    }
    var localeOrReqType = typeof(localeOrReq);
    if (localeOrReqType !== 'undefined') {
        if (localeOrReqType !== 'object' && localeOrReqType !== 'string') {
            throw new Error('Invalid locale or request; must be a string (locale, e.g. "en-US", or express request, but was ' + localeOrReqType);
        }
    }
    var bundle;
    if (localeOrReq) {
        // locale specified in get; resolve bundle
        bundle = resolveBundle(path, resolveLocale(localeOrReq)).data;
    } else {
        // no locale specified for bundle or get; use default
        bundle = resolveBundle(path).data;
    }
    return msg(bundle, path, key, args);
}

/*
 * Helper function to resolve msgs in bundles.
 */
function msg(bundle, filename, key, args) {
    var value = bundle ? bundle[key] : undefined;
    if (value) {
        // found the message
        if (args) {
            value = resolveArgs(value, args);
        }
        return value;
    }
    throw new Error('Unknown message key \'' + key + '\' in message bundle \'' + filename + '\'');
}
