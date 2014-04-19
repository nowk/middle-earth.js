/* jshint node: true */

var assert = require('chai').assert;
var request = require('supertest');
var sinon = require('sinon');

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

  describe("load", function() {
    it("always over writes the existing middlewares in queue to be `use`", function(){
      app
        .middlewares([
          {name: 'one', fn: mw('one')}
        ])
        .append([
          {name: 'a', fn: mw('a')}
        ])
        .load([
          {name: 'two', fn: mw('one')}
        ]);

      assert.lengthOf(app.middlewares().middlewares, 1);
      assert.equal(app.middlewares().middlewares[0].name, 'two');
    });
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

  describe("before", function() {
    it("throws an error if the middleware is not found", function() {
      assert.throw(function() {
        app
          .middlewares([
            {name: 'one', fn: mw('one')}
          ])
          .before('two', {name: 'a', fn: mw('a')});
      }, "Middleware named `two` could not be found");
    });
  });

  describe("after", function() {
    it("throws an error if the middleware is not found", function() {
      assert.throw(function() {
        app
          .middlewares([
            {name: 'one', fn: mw('one')}
          ])
          .after('two', {name: 'a', fn: mw('a')});
      }, "Middleware named `two` could not be found");
    });
  });

  it("supports pathed middlewares", function(done) {
    var one = function(req, res, next) {
      res.send({one: true});
    };

    app
      .middlewares([
        {name: 'one', fn: one, path: "/one"}
      ])
      .finish();

    app.get("/", function(req, res, next) {
      res.send(401);
    });

    request(app)
      .get("/one")
      .expect(200, {
        one: true
      })
      .end(function() {
        request(app)
          .get("/")
          .expect(401)
          .end(done);
      });
  });

  it("throws when there is a name collision", function() {
    assert.throw(function() {
      app
        .middlewares([
          {name: 'one', fn: mw('one')},
          {name: 'one', fn: mw('two')}
        ]);
    }, "Middleware with name `one` already exists");

    assert.throw(function() {
      app
        .middlewares([
          {name: 'one', fn: mw('one')}
        ])
        .before('one', {name: 'one', fn: mw('two')});
    }, "Middleware with name `one` already exists");

    assert.throw(function() {
      app
        .middlewares([
          {name: 'one', fn: mw('one')}
        ])
        .after('one', {name: 'one', fn: mw('two')});
    }, "Middleware with name `one` already exists");

    assert.throw(function() {
      app
        .middlewares([
          {name: 'one', fn: mw('one')}
        ])
        .prepend([
          {name: 'one', fn: mw('two')}
        ]);
    }, "Middleware with name `one` already exists");

    assert.throw(function() {
      app
        .middlewares([
          {name: 'one', fn: mw('one')}
        ])
        .append([
          {name: 'one', fn: mw('two')}
        ]);
    }, "Middleware with name `one` already exists");
  });

  describe("finish", function() {
    it("clears out the middlewares queue", function() {
      app
        .middlewares([
          {name: 'one', fn: mw('one')},
        ])
        .append([
          {name: 'two', fn: mw('two')}
        ]);
      assert.lengthOf(app.middlewares().middlewares, 2);

      app.middlewares().finish();
      assert.lengthOf(app.middlewares().middlewares, 0);
    });

    it("warns when #finish is called more than once", function() {
      var msg = "MiddleEarth middlewares have already been applied";
      var c = sinon.mock(console);
      c.expects('warn').withArgs(msg).once();

      app
        .middlewares([
          {name: 'one', fn: mw('one')}
        ])
        .finish();

      app.middlewares().finish();

      c.verify();
      c.restore();
    });
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

