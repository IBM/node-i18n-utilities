/*******************************************************************************
 * Licensed Materials - Property of IBM
 * (c) Copyright IBM Corporation 2014, 2016. All Rights Reserved.
 *
 * Note to U.S. Government Users Restricted Rights:
 * Use, duplication or disclosure restricted by GSA ADP Schedule
 * Contract with IBM Corp.
 *******************************************************************************/
"use strict";

var fs = require("fs");

var UNICODE_REGEX = /\\u([\d\w]{4})/gi;

/*
 * Loads the given .properties file synchronously. The returned object has the message keys as
 * its keys, and corresponding string values. If no encoding is specified, the default is UTF-8.
 *
 * Lines containing only whitespace and lines starting with # are ignored. Unicode escape sequences
 * (e.g. \uC778) are interpreted, and preceding and trailing whitespace is trimmed from both keys and
 * values.
 */
exports.loadFileSync = function(filename, encoding) {
	var str = fs.readFileSync(filename, {encoding: encoding || "UTF-8"});
	return exports.load(str);
};

/*
 * Loads the given contents of a .properties file as a string, same as loadFileSync.
 */
exports.load = function(str) {
	var data = {};
	var lines = str.split("\n");
	for (var i=0,len=lines.length;i<len;++i) {
		var line = lines[i];
		if (line.trim().length === 0 || line[0] === "#") {
			continue;
		}
		var idx = line.indexOf("=");
		if (idx === -1) {
			console.error("Invalid line in properties file: " + line);
			continue;
		}
		var key = line.substring(0, idx).trim();
		data[key] = line.substring(idx + 1).trim().replace(UNICODE_REGEX, processUnicode);
	}
	return data;
};

/*
 * Processes a unicode escape sequence from processMessages, e.g. "\u30A6".
 */
function processUnicode(match, p1) {
	return String.fromCharCode(parseInt(p1, 16));
}
