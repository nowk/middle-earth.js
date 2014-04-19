/* jshint node: true */

var express = require('express');
var app = express.application;


/*
 * expose MiddleEarth
 */

module.exports = MiddleEarth;


/*
 * MiddleEarth
 */

function MiddleEarth(app) {
  this.app = app;
  this.middlewares = [];
}


/*
 * load middlewares
 *
 * @param {Array} mws
 * @return {MiddleEarth}
 */

MiddleEarth.prototype.load = function(mws) {
  var self = this;

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
    self.app.use(m.fn);
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

MiddleEarth.prototype.before = function(name, mw) {
  var index = indexOf.call(this, name);
  this.middlewares.splice(index, 0, mw);

  return this;
};


/*
 * insert a middleware after another
 *
 * @param {String} name
 * @param {Object} mw
 * @return {MiddleEarth}
 */

MiddleEarth.prototype.after = function(name, mw) {
  var index = indexOf.call(this, name);
  this.middlewares.splice(index+1, 0, mw);

  return this;
};


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

