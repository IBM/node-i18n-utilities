/*******************************************************************************
 * Licensed Materials - Property of IBM
 * (c) Copyright IBM Corporation 2016. All Rights Reserved.
 *
 * Note to U.S. Government Users Restricted Rights:
 * Use, duplication or disclosure restricted by GSA ADP Schedule
 * Contract with IBM Corp.
 *******************************************************************************/
'use strict';

var ARGS_REGEX = /\{([0-9]+)\}/g,
    ARG_REGEX = /\{0\}/g;

module.exports = function(bundlePath) {
    return {
        'get': function(key, arg2) {
            // client ignores the 3rd arg (locale or request) since it only loads the client locale
            var args;
            if (Array.isArray(arg2)) {
                args = arg2;
            }
            var bundle = window.nls[bundlePath];
            if (bundle) {
                var msg = bundle[key];
                if (msg) {
                    return resolveArgs(msg, args);
                }
            }
            return "!" + key + "!";
        }
    };
}

function resolveArgs(msg, args) {
    if (!args) {
        args = [];
    } else if (!Array.isArray(args)) {
        args = [args];
    }
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
            return '';
        }
    });
}
