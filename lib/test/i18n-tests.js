/*******************************************************************************
 * Licensed Materials - Property of IBM
 * (c) Copyright IBM Corporation 2016. All Rights Reserved.
 * 
 * Note to U.S. Government Users Restricted Rights:
 * Use, duplication or disclosure restricted by GSA ADP Schedule
 * Contract with IBM Corp.
 *******************************************************************************/
"use strict";

var assert = require("assert"),
	i18n = require("../i18n");

suite("i18n tests", function() {

	test("invalid require throws error", function() {
		assert.throws(function() {
			require('doesntexist.properties');
		});
		assert.throws(function() {
			require('./doesntexist.properties');
		});
		assert.throws(function() {
			require('/path/to/doesntexist.properties');
		});
	});

	test("invalid message key", function() {
		var test = require('./data/test.properties');
        var data = [
            undefined, null, {}, [], function(){}, 0, 42, '', 'missingkey'
        ];
        for (var i=0,len=data.length;i<len;++i) {
            assert.throws(function() {
                test.get(data[i]);
            });
        }
        assert.throws(function() {
            test.get();
        });
	});

    test("invalid request or locale", function() {
        var test = require('./data/test.properties');
        var data = [
            0, 42, {}
        ];
        for (var i=0,len=data.length;i<len;++i) {
            assert.throws(function() {
                test.get('hello', data[i]);
            });
            assert.throws(function() {
                test.get('hello', ['arg'], data[i]);
            });
        }
    });

    test("resolve bundles", function() {
        require('./data/test.properties');
        require('./data/test2.properties');
        require('./data/subfolder/test2.properties');
    });

    test("resolve message keys", function() {
        var test = require('./data/test.properties');
        assert.equal(test.get('hello'), "Hello, World!");
        assert.equal(test.get("message.with.symbols-a_b+c", "test"), "Message with symbols");
        assert.equal(test.get("message.with.symbols-a_b+c"), "Message with symbols");
        assert.equal(test.get("prefix"), "Prefix");
        assert.equal(test.get("prefix.suffix"), "Suffix");
    });

    test("decode dbcs unicode escape sequences", function() {
        var test = require('./data/test.properties');

        assert.equal(test.get('dbcs'), "日本語");
    });

    test("message with arguments", function() {
        var test = require('./data/test.properties');

        assert.equal(test.get("args.1"), "Message with arg \"{0}\"");
        assert.equal(test.get("args.1", ["hello"]), "Message with arg \"hello\"");
        assert.equal(test.get("args.1", ["hello", "extraarg"]), "Message with arg \"hello\"");
        assert.equal(test.get("args.2"), "Message with args: {0}, {1}");
        assert.equal(test.get("args.2", ["value1"]), "Message with args: value1, {1}");
        assert.equal(test.get("args.2", ["value1", "value2"]), "Message with args: value1, value2");

        assert.equal(test.get("args.1", [0]), "Message with arg \"0\"");
        assert.equal(test.get("args.1", ["0"]), "Message with arg \"0\"");
        assert.equal(test.get("args.1", ["null"]), "Message with arg \"null\"");
        assert.equal(test.get("args.1", ["undefined"]), "Message with arg \"undefined\"");
        assert.equal(test.get("args.1", [""]), "Message with arg \"\"");
        assert.equal(test.get("args.1", [null]), "Message with arg \"\"");
        assert.equal(test.get("args.1", [undefined]), "Message with arg \"\"");
    });

    test("locale bundle resolution", function() {
        var test = require('./data/test.properties'),
            test2 = require('./data/test2.properties');

        assert.equal(test2.get("hello"), "Hello, World!");
        assert.equal(test2.get("hello", 'en'), "Hello, World!");
        assert.equal(test2.get("hello", 'fr'), "Bonjour, Monde!");
        assert.equal(test2.get("hello", "fr-FR"), "Bonjour, Monde!");
        assert.equal(test2.get("hello", "fr-CA"), "Allo, Monde!");
        assert.equal(test.get("hello", "ja"), "Hello, World!");
        assert.equal(test.get("hello", "ja-JP"), "Hello, World!");
    });

    test("incomplete message bundle fallback", function() {
        var test2 = require('./data/test2.properties');

        assert.equal(test2.get("goodbye", "fr-CA"), "Au revoir!");
        assert.equal(test2.get("foo", "fr-CA"), "bar");
        assert.equal(test2.get("foo", "fr"), "bar");
        assert.equal(test2.get("key.with.dots", "fr"), "Hello");
    });

    test("resolving locale from request", function() {
        var test2 = require('./data/test2.properties');

        assert.equal(test2.get("hello", makeRequest("en")), "Hello, World!");
        assert.equal(test2.get("hello", makeRequest("fr")), "Bonjour, Monde!");
        assert.equal(test2.get("hello", makeRequest("fr-CA")), "Allo, Monde!");
        assert.equal(test2.get("hello", makeRequest("ja-JP")), "Hello, World!");
    });

    test("locale with args", function() {
        var test = require('./data/test.properties');
        assert.equal(test.get("args.1", ["hello"], "en"), 'Message with arg "hello"');
    });

    test("get locale from request", function() {
        assert.equal(i18n.locale(makeRequest()), undefined);
        assert.equal(i18n.locale(makeRequest("en")), "en");
        assert.equal(i18n.locale(makeRequest("EN")), "en");
        assert.equal(i18n.locale(makeRequest("ja-JP")), "ja-JP");
        assert.equal(i18n.locale(makeRequest("FR-fr")), "fr-FR");
        assert.equal(i18n.locale(makeRequest("pt-br")), "pt-BR");
    });
});

function makeRequest(locale) {
    return {
        acceptsLanguages: function() {
            return [locale];
        }
    };
}
