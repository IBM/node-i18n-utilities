# Internationalization (i18n) library for Node.js

A library for translating apps in Node.js, by externalizing strings into .properties files
and resolving to the right translation.

## Usage

#### Externalize user-visible strings into .properties files ([Java Property Resource Bundle](https://en.wikipedia.org/wiki/.properties) format).

The default locale (usually en) should be in the main file, e.g. `msgs.properties`.
Translations are placed in files corresponding to their locale and country codes,
e.g. `msgs_ja.properties` for the Japanese translation, and `msgs_pt_BR.properties` for
the Brazilian Portuguese translation. They must be in the same directory.

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
