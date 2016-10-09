'use strict'

var Receptacle = require('receptacle')
var NAMESPACE = 'loader_'
var _getters = {}
var slice = Array.prototype.slice
var shared = new Receptacle()

module.exports = loader
module.exports.register = register

/**
 * Creates a middleware that will attach a rill/loader.
 */
function loader (opts) {
  return function loaderMiddleware (ctx, next) {
    ctx.assert(ctx.session, 500, 'A session is required to use @rill/load.')
    ctx.load = function load (name) {
      ctx.assert(_getters[name], 500, '@rill/load: Could not load [' + name + ']')
      return _getters[name](ctx, slice.call(arguments, 1))
    }

    return next()
  }
}

/**
 * Registers a "getter" which can load data into the cache.
 *
 * @param {String} name - The name (on locals) where the data will be stored when retrieved.
 * @param {Object} opts - Options passed to the receptacle setter.
 * @param {Function} fn - A function that will resolve a value and cache it.
 */
function register (opts, fn) {
  if (typeof opts !== 'object') {
    throw new TypeError('@rill/load: Register arguments[0] must be an options object.')
  }

  var name = opts.name

  if (typeof name !== 'string') {
    throw new TypeError('@rill/load: Register options must have a name property.')
  }

  if (typeof fn !== 'function') {
    throw new TypeError('@rill/load: Register arguments[1||2] must be a function.')
  }

  /**
   * A getter function that will load some data or return it from a cache.
   */
  _getters[name] = getter
  function getter (ctx, args) {
    var key = NAMESPACE + name + JSON.stringify(args)
    var cache = opts.shared ? shared : ctx.session
    var exists = cache.has(key)
    args = [ctx].concat(args)
    return Promise
      // Check if we can used the cached data or load some new data.
      .resolve(exists ? cache.get(key) : fn.apply(opts, args))
      .then(function setLocals (data) {
        // If this was a new key we cache it.
        if (!exists) {
          cache.set(key, data, opts)
        }

        if (shared && !ctx.session.has(key)) {
          ctx.session.set(key, data, {
            refresh: opts.refresh,
            meta: opts.meta,
            ttl: opts && opts.ttl && cache.items[key].expires - new Date()
          })
        }

        // Store data on locals for middleware access.
        ctx.locals[name] = data
        return data
      })
  }
}
