# Internationalization (i18n) library for Node.js

A library for translating apps in Node.js, by externalizing strings into .properties files
and resolving to the right translation.

## Usage

##### Externalize user-visible strings into .properties files ([Java Property Resource Bundle](https://en.wikipedia.org/wiki/.properties) format).

The default locale (usually en) should be in the main file, e.g. msgs.properties.
Translations are placed in files corresponding to their locale and country codes,
e.g. msgs_ja.properties for the Japanese translation, and msgs_pt_BR.properties for
the Brazilian Portuguese translation. They must be in the same directory.

e.g.
* msgs.properties          _original English strings_
* msgs_fr.properties       _French translation_
* msgs_ja.properties       _Japanese translation_
* msgs_pt_BR.properties    _Brazilian Portuguese translation_

##### Load strings from properties files

```
// must require this before requiring any .properties files
require('i18n');

var msgs = require('./msgs.properties');

// default locale (usually English)
msgs.get('key');

// specific locale (French)
msgs.get('key', 'fr')

// use the preferred locale of the incoming express request
msgs.get('key', req);
```
