# Internationalization (i18n) library for Node.js

A library for translating apps in Node.js, by externalizing strings into .properties files
and resolving to the right translation.

This project originated out of [Bluemix Continuous Delivery](https://bluemix.net/devops).

This is one of hundreds of [IBM Open Source projects at GitHub](http://ibm.github.io).

# License

[The MIT License (MIT)](LICENSE.txt)

# Contributing

Contributions are welcome via Pull Requests. Please submit your very first Pull Request against the [Developer's Certificate of Origin](DCO.txt), adding a line like the following to the end of the file... using your name and email address of course!

Note that all contributions *must* be submitted through pull requests and have to pass the Travis Status Checks in order for code to be merged into master.

Signed-off-by: John Doe <john.doe@example.org>


## Installation

```
npm i node-i18n-util -S
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

From your code, you then add requires to the properties files, a loader for these files is registered in the `node-i18n-util` module, so you must require it before any properties files.

```
// require i18n before any properties files
require('node-i18n-util');

// always require the main file, not a specific translation
var msgs = require('./msgs.properties');

// default locale (usually English)
msgs.get('key');

// specific locale (French)
msgs.get('key', 'fr')

// use the preferred locale of the incoming Express request
msgs.get('key', req);
```

#### Server-side typical usage

Normally, when servicing requests where you return strings that may be visible to the user, you would just respond in the preferred language of the request. Here's an example that says hello in different languages.

```
var express = require('express');
var app = express();
var i18n = require('node-i18n-util');
var msgs = require('./msgs.properties);

app.get('/', function (req, res) {
  res.send(msgs.get('hello', req));
});
```

Where the properties files might look as follows:

msgs.properties:
```
hello = Hello!
```

msgs_fr.properties:
```
hello = Bonjour!
```

The app will respond in English or in French depending on the language preference specified in the request via the `Accept-Language` header, which browsers will send based on their language settings.

#### Strings with arguments

Sometimes you need to produce a translated string that has a value substituted into it, e.g. _"Are you sure you want to delete the project Foo?"_ Here _Foo_ is the name of the project. You should not make assumptions about where a word appears in a sentence, e.g. don't just concatenate `msgs.get('confirm.delete') + projectName`, because in other languages the sentence structure is different. Instead, you should inject variables into the string:

msgs.properties:
```
confirm.delete = Are you sure you want to delete the project {0}?
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
var i18n = require('node-i18n-util');
...
i18n.locale(req);
```

### Resolving objects to a locale

Given an object of the form:
```
var obj = {
  prop1: "value",
  prop2: { ... }
  default_locale: "en",
  locales: {
    "fr": {
       prop1: "valeur",
       prop2: { ... }
    }
    "ja": {
       prop1: "値",
       prop2: { ... }
    }
  }
};
```

You can resolve the object to a specific locale via:

```
var resolvedObj = i18n.resolveLocale(obj, 'ja');
```

You can also supply an express request instead of the locale, and it will use the preferred language of the request.
This will substitute the translation into the main structure of the document, and strip the extra translation info out. e.g.

```
{
  prop1: "値",
  prop2: { ... }
}
```


