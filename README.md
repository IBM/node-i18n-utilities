# Internationalization (i18n) library for Node.js

A library for translating apps in Node.js, by externalizing strings into .properties files
and resolving to the right translation.

## Installation

```
npm install git+https://github.ibm.com/org-ids/node-i18n#<LatestTag> --save
```

## Usage

#### Externalize user-visible strings into .properties files

All user-visible strings should be externalized into .properties files ([Java Property Resource Bundle](https://en.wikipedia.org/wiki/.properties) format) so they can be translated rather than
hardcoded in the app for a specific language. The default locale (usually en) should be in the
main file, e.g. `msgs.properties`. Translations are placed in files corresponding to their locale
and country codes, e.g. `msgs_ja.properties` for the Japanese translation, and `msgs_pt_BR.properties`
for the Brazilian Portuguese translation. They must be in the same directory.

e.g.
* `msgs.properties`         _original English strings_
* `msgs_fr.properties`       _French translation_
* `msgs_ja.properties`       _Japanese translation_
* `msgs_pt_BR.properties`    _Brazilian Portuguese translation_

As a developer, you would typically write the main file (e.g. here, `msgs.properties`) and receive all the translation files from a translation team.

#### Load strings from properties files

From your code, you then add requires to the properties files, a loader for these files is registered in the `i18n` module, so you must require it before any properties files.

```
// require i18n before any properties files
require('i18n');

// always require the main file, not a specific translation
var msgs = require('./msgs.properties');

// default locale (usually English)
msgs.get('key');

// specific locale (French)
msgs.get('key', 'fr')

// use the preferred locale of the incoming express request
msgs.get('key', req);
```

#### Server-side typical usage

Normally, when servicing requests where you return strings that may be visible to the user, you would just respond in the preferred language of the request. Here's an example that says hello in different languages.

```
var express = require('express');
var app = express();
var i18n = require('i18n');
var msgs = require('./msgs.properties);

app.get('/', function (req, res) {
  res.send(msgs.get('hello', req));
});
```

Where the properties files might look as follows:

msgs.properties:
```
hello=Hello!
```

msgs_fr.properties:
```
hello=Bonjour!
```

The app will respond in English or in French depending on the language preference specified in the request via the `Accept-Language` header, which browsers will send based on their language settings.

#### Strings with arguments

Sometimes you need to produce a translated string that has a value substituted into it, e.g. _"Are you sure you want to delete the project Foo?"_ Here _Foo_ is the name of the project. You should not make assumptions about where a word appears in a sentence, e.g. don't just concatenate msgs.get('confirm.delete') + projectName, because in other languages the sentence structure is different. Instead, you should inject variables into the string:

msgs.properties:
```
confirm.delete=Are you sure you want to delete the project {0}?
```

This way the translator will move the variable to the right location for that language. You can then provide an array of values to inject into a string:

```
msgs.get('confirm.delete', [projectName], req);
```

The first argument of the array will match {0}, the second {1}, and so on.

### Locale resolution

We can't always get a perfect locale match for a given request, e.g. we may not have a French Canadian translation, but we have a French one. The rules for resolving a locale into a suitable translation are:

e.g. for bundle `msgs.properties`, locale `fr_CA`

1. Try `msgs_fr_CA.properties` (perfect match)
2. If not found, try `msgs_fr.properties` (French)
3. If not found, try `msgs.properties` (default, English)

For resolving messages based on the preferences of the incoming request (via the `Accept-Language` header), only the first language (most preferred) is considered.

You can get the preferred locale of a request as follows:
```
var i18n = require('i18n');
...
i18n.locale(req);
```
