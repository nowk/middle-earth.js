# Middle Earth

Middleware manager for [Express.js](https://github.com/visionmedia/express)

## Why...?

Needed a ring to control them all.

## Install

    npm install middle-earth

## Usage

Examples below are basic. But should give you an idea of what is possible.

---

Appending and/or prepending.

    var express = require('express');
    var middlewares = require('middle-earth');
    var bodyParser = require('body-parser');
    var methodOverride = require('method-override');
    var app = express();

    app
      .middlewares([
        {name: 'body-parser', fn: bodyParser()},
        {name: 'method-override', fn: methodOverride()}
      ]);

    if (['production', 'staging'].indexOf(process.env.NODE_ENV) >= 0) {
      app
        .middlewares()
        .prepend([
          {name: 'basicAuth', fn: express.basicAuth("user", "strong")}
        ])
        .append([
          {name: 'something-else', fn: function(req, res, next) { /* ... */ }},
          {name: 'and-another', fn: function(req, res, next) { /* ... */ }}
        ]);
    }

    app.middlewares().finish(); // apply the middlewares to app. `use` them.


    // !production || !staging
    // 1. body-parser
    // 2. method-override

    // production || staging
    // 1. basicAuth
    // 2. body-parser
    // 3. method-override
    // 4. something-else
    // 5. and-another

---

You can also insert a middleware before or after another.

    app
      .middlewares([
        {name: 'body-parser', fn: bodyParser()},
        {name: 'method-override', fn: methodOverride()}
      ]);


    if ('staging' === process.env.NODE_ENV) {
      app
        .middlewares()
        .before('body-parser', {name: 'basicAuth', fn: express.basicAuth("user", "strong")});
    }

    if ('production' === process.env.NODE_ENV) {
      app
        .middlewares()
        .after('body-parser', {name: 'basicAuth', fn: function(req, res, next) { /* ... */ }});
    }

    app.middlewares().finish();


    // !production || !staging
    // 1. body-parser
    // 2. method-override

    // staging
    // 1. basicAuth
    // 2. body-parser
    // 3. method-override

    // production
    // 1. body-parser
    // 2. basicAuth
    // 3. method-override

---

Pathed middlewares

    app
      .middlewares([
        {name: 'body-parser', fn: bodyParser()},
        {name: 'method-override', fn: methodOverride()},
        {name: 'static', fn: express.static(__dirname+'/../public')}
      ])
      .append([
        {name: 'component-build-static', fn: express.static(__dirname + '/../build'), path: '/build'}
      ]);

    app.middlewares().finish();


## Important

This does not alter middlewares already applied (`use`'d) on the `app`. 

You can use it in conjuction with the normal `app.use()`, but middlewares will be applied when you call `#finish()` and the order will be set accordingly to that invocation point.


## Test

    npm test


## License

MIT
