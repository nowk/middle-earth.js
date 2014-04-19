/* jshint node: true */

var express = require('express');
var app = express.application;


/*
 * expose MiddleEarth
 */

module.exports = MiddleEarth;


/*
 * MiddleEarth
 *
 * @param {Application} app
 * @constructor
 */

function MiddleEarth(app) {
  this.app = app;
  this.middlewares = [];
}


/*
 * load middlewares
 *
 * #load should ALWAYS be called first or using the short cut app.middlewares([..,..]),
 * it will overwrite any exisiting middlewares in queue
 *
 * @param {Array} mws
 * @return {MiddleEarth}
 */

MiddleEarth.prototype.load = function(mws) {
  var self = this;

  self.middlewares = [];

  mws.forEach(function(o, i) {
    self.middlewares.push(o);
  });

  return self;
};


/*
 * `use` middlewares to the app
 */

MiddleEarth.prototype.finish = function() {
  var self = this;

  self.middlewares.forEach(function(m, i) {
    if (m.hasOwnProperty('path')) {
      self.app.use(m.path, m.fn);
    } else {
      self.app.use(m.fn);
    }
  });

  // delete self.app.middleEarth;
};


/*
 * applies the middlewares to the front of the list
 *
 * @param {Array} mws
 * @return {MiddleEarth}
 */

MiddleEarth.prototype.prepend = function(mws) {
  this.middlewares = [].concat.apply(mws, this.middlewares);

  return this;
};


/*
 * applies the middlewares to the end of the list
 *
 * @param {Array} mws
 * @return {MiddleEarth}
 */

MiddleEarth.prototype.append = function(mws) {
  this.middlewares = [].concat.apply(this.middlewares, mws);

  return this;
};


/*
 * inserts a middleware before another
 *
 * @param {String} name
 * @param {Object} mw
 * @return {MiddleEarth}
 */

MiddleEarth.prototype.before = insert();


/*
 * insert a middleware after another
 *
 * @param {String} name
 * @param {Object} mw
 * @return {MiddleEarth}
 */

MiddleEarth.prototype.after = insert(true);


/*
 * insert method
 *
 * @param {Boolean} after
 * @return {Function}
 */

function insert(after) {
  return function(name, mw) {
    var index = indexOf.call(this, name);

    if (index < 0) {
      var msg = "Middleware named `"+name+"` could not be found";
      throw new Error(msg);
    }

    if (true === after) {
      index = index+1;
    }

    this.middlewares.splice(index, 0, mw);

    return this;
  };
}


/*
 * locate middleware
 *
 * @param {String} name
 * @return {Number}
 */

function indexOf(name) {
  var middlewares = this.middlewares;
  var i = 0;
  var len = middlewares.length;

  for(; i<len; i++) {
    if (middlewares[i].name === name) {
      return i;
    }
  }

  return -1;
}




/*
 * add method to app
 *
 * @param {Array} mws
 * @return {MiddleEarth}
 */

app.middlewares = function(mws) {
  if (!(this.middleEarth instanceof MiddleEarth)) {
    this.middleEarth = new MiddleEarth(this);
  }

  if ('undefined' === typeof mws) {
    return this.middleEarth;
  }

  return this.middleEarth.load(mws);
};

