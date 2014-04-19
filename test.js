/* jshint node: true */

var assert = require('chai').assert;
var request = require('supertest');

var express = require('express');
var middlewares = require('.');

// var app = express();
var fn = function(req, res, next) {
  res.send({middlewares: res.locals.middlewares});
};


describe("middle-earth", function() {
  var app;

  beforeEach(function() {
    app = express();
  });

  afterEach(function() {
    app = null;
  });


  it("loads middlewares", function(done) {
    app
      .middlewares([
        {name: 'one', fn: mw('one')},
        {name: 'two', fn: mw('two')},
        {name: 'three', fn: mw('three')}
      ])
      .finish();

    app.get("/", fn);

    request(app)
      .get("/")
      .expect(200, {
        middlewares: ['one', 'two', 'three']
      })
      .end(done);
  });

  it("prepends middlewares", function(done) {
    app
      .middlewares()
      .load([
        {name: 'one', fn: mw('one')},
        {name: 'two', fn: mw('two')}
      ])
      .prepend([
        {name: 'three', fn: mw('three')},
        {name: 'four', fn: mw('four')}
      ])
      .finish();

    app.get("/", fn);

    request(app)
      .get("/")
      .expect(200, {
        middlewares: ['three', 'four', 'one', 'two']
      })
      .end(done);
  });

  it("appends middlewares", function(done) {
    app
      .middlewares([
        {name: 'three', fn: mw('three')}
      ])
      .prepend([
        {name: 'two', fn: mw('two')}
      ]);

    app
      .middlewares()
      .append([
        {name: 'four', fn: mw('four')},
        {name: 'five', fn: mw('five')}
      ]);

    app.middlewares().finish();

    app.get("/", fn);

    request(app)
      .get("/")
      .expect(200, {
        middlewares: ['two', 'three', 'four', 'five']
      })
      .end(done);
  });

  it("inserts before/after another middleware", function(done) {
    app
      .middlewares([
        {name: 'three', fn: mw('three')},
        {name: 'four', fn: mw('four')}
      ])
      .append([
        {name: 'five', fn: mw('five')}
      ])
      .prepend([
        {name: 'one', fn: mw('one')},
        {name: 'two', fn: mw('two')}
      ]);

    app
      .middlewares()
      .before("two", {name: 'b', fn: mw('b')})
      .before("b", {name: 'a', fn: mw('a')})
      .after("three", {name: 'c', fn: mw('c')})
      .after("c", {name: 'd', fn: mw('d')});

    app.middlewares().finish();

    app.get("/", fn);

    request(app)
      .get("/")
      .expect(200, {
        middlewares: ['one', 'a', 'b', 'two', 'three', 'c', 'd', 'four', 'five']
      })
      .end(done);
  });
});


/*
 * middleware
 *
 * @param {String} val
 * @return {Function}
 */

function mw(val) {
  return function(req, res, next) {
    if (!res.locals.middlewares) {
      res.locals.middlewares = [];
    }
    res.locals.middlewares.push(val);
    next();
  };
}

