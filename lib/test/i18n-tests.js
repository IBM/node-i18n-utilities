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

        assert.equal(test.get("args.1"), "Message with arg \"\"");
        assert.equal(test.get("args.1", ["hello"]), "Message with arg \"hello\"");
        assert.equal(test.get("args.1", ["hello", "extraarg"]), "Message with arg \"hello\"");
        assert.equal(test.get("args.2"), "Message with args: , ");
        assert.equal(test.get("args.2", ["value1"]), "Message with args: value1, ");
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

    test("underscore in properties file name", function() {
        var test3 = require('./data/test3_underscore.properties'),
            test4 = require('./data/test4_underscore.properties');

        assert.equal(test3.get("hello"), "Hello, World!");
        assert.equal(test3.get("hello", 'en'), "Hello, World!");
        assert.equal(test3.get("hello", 'fr'), "Hello, World!");
        assert.equal(test3.get("hello", "fr-FR"), "Hello, World!");

        assert.equal(test4.get("hello"), "Hello, World!");
        assert.equal(test4.get("hello", 'en'), "Hello, World!");
        assert.equal(test4.get("hello", 'fr'), "Bonjour, Monde!");
        assert.equal(test4.get("hello", "fr-FR"), "Bonjour, Monde!");
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

    test("resolve object to locale", function() {
        var data = [
            // empty obj
            {},
            'en',
            {},

            // simple obj with no localization
            { prop: 'value' },
            'en',
            { prop: 'value' },

            // no locale provided
            { prop: 'value' },
            null,
            { prop: 'value' },

            // more complex obj with no localization
            {
                prop: 'value',
                subobj: {
                    prop2: 'value2'
                }
            },
            'fr',
            {
                prop: 'value',
                subobj: {
                    prop2: 'value2'
                }
            },

            // simplest case
            {
                prop: 'value',
                default_locale: 'en',
                locales: {
                    'fr': {
                        prop: 'value_fr'
                    }
                }
            },
            'fr',
            {
                prop: 'value_fr'
            },

            // no locale; use default
            {
                prop: 'value',
                default_locale: 'en',
                locales: {
                    'fr': {
                        prop: 'value_fr'
                    }
                }
            },
            null,
            {
                prop: 'value'
            },

            // nested objects
            {
                prop: 'value',
                prop2: {
                    prop2: 'value2',
                    subobj2: {
                        prop3: 'value3',
                    }
                },
                default_locale: 'en',
                locales: {
                    'ja': {
                        prop: 'value_ja',
                        prop2: {
                            prop2: 'value2_ja',
                            subobj2: {
                                prop3: 'value3_ja',
                            }
                        }
                    }
                }
            },
            'ja',
            {
                prop: 'value_ja',
                prop2: {
                    prop2: 'value2_ja',
                    subobj2: {
                        prop3: 'value3_ja',
                    }
                }
            },

            // arrays
            {
                prop: ['value', 'value2'],
                prop2: [{ a: 'a' }, { b: 'b' }],
                prop3: [{}, { a: 1 }, { b: 'b' }],
                prop4: [],
                prop5: [ null, 1, 'a', true, false, {}, [], [[], []]],
                default_locale: 'en',
                locales: {
                    'es': {
                        prop: ['value_es', 'value2_es'],
                        prop2: [{ a: 'a_es' }, { b: 'b_es' }],
                        prop3: [{}, {}, { b: 'b_es' }],
                        prop5: [ null, null, 'a_es'],
                    }
                }
            },
            'es',
            {
                prop: ['value_es', 'value2_es'],
                prop2: [{ a: 'a_es' }, { b: 'b_es' }],
                prop3: [{}, { a: 1 }, { b: 'b_es' }],
                prop4: [],
                prop5: [ null, 1, 'a_es', true, false, {}, [], [[], []]]
            },

            // types
            {
                prop: null,
                prop2: 0,
                prop3: -123.456,
                prop4: true,
                prop5: false,
                prop6: [],
                prop7: {},
                default_locale: 'en',
                locales: {
                    'fr': {
                    }
                }
            },
            'fr',
            {
                prop: null,
                prop2: 0,
                prop3: -123.456,
                prop4: true,
                prop5: false,
                prop6: [],
                prop7: {}
            },

            // locale resolution
            {
                prop: 'value',
                default_locale: 'en',
                locales: {
                    'fr': {
                        prop: 'value_fr'
                    }
                }
            },
            'fr-FR',
            {
                prop: 'value_fr'
            },

            // locale resolution - perfect match
            {
                prop: 'value',
                default_locale: 'en',
                locales: {
                    'pt-BR': {
                        prop: 'value_pt-BR'
                    }
                }
            },
            'pt-BR',
            {
                prop: 'value_pt-BR'
            },

            // locale resolution - imperfect match
            {
                prop: 'value',
                default_locale: 'en',
                locales: {
                    'zh': {
                        prop: 'value_zh'
                    },
                    'zh-CN': {
                        prop: 'value_zh-CN'
                    }
                }
            },
            'zh-TW',
            {
                prop: 'value_zh'
            },

            // locale resolution - locale variant
            {
                prop: 'value',
                default_locale: 'en',
                locales: {
                    'zh-CN': {
                        prop: 'value_zh-CN'
                    },
                }
            },
            'zh-Hans',
            {
                prop: 'value_zh-CN'
            },

            // locale resolution - no match
            {
                prop: 'value',
                default_locale: 'en',
                locales: {
                    'es': {
                        prop: 'value_es'
                    }
                }
            },
            'ja',
            {
                prop: 'value'
            },

            // apply default locale
            {
                prop: 'value',
                default_locale: 'en',
                locales: {
                    'en': {
                        prop: 'value_en'
                    },
                    'es': {
                        prop: 'value_es'
                    }
                }
            },
            null,
            {
                prop: 'value_en'
            },

            // apply default locale 2
            {
                prop: 'value',
                default_locale: 'en',
                locales: {
                    'en': {
                        prop: 'value_en'
                    },
                    'es': {
                        prop: 'value_es'
                    }
                }
            },
            'pt-BR',
            {
                prop: 'value_en'
            }
        ];
        for (var i=0,len=data.length;i<len;i+=3) {
            var actual = JSON.stringify(i18n.resolveLocale(data[i], data[i+1]), null, 3);
            var expected = JSON.stringify(data[i+2], null, 3);
            assert.equal(actual, expected);
        }
    });

    test("resolve object to locale using request", function() {
        var obj = {
            prop: 'value',
            default_locale: 'en',
            locales: {
                'fr': {
                    prop: 'value_fr'
                }
            }
        };
        var resolved = i18n.resolveLocale(obj, makeRequest('fr'));
        assert.equal(resolved.prop, 'value_fr');
    });
});

function makeRequest(locale) {
    return {
        acceptsLanguages: function() {
            return [locale];
        }
    };
}
