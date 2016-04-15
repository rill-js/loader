'use strict'

var _getters = {}
var slice = Array.prototype.slice

module.exports = loader
module.exports.register = register

/**
 * Creates a middleware that will attach a rill/loader.
 */
function loader (opts) {
  return function loaderMiddleware (ctx, next) {
    ctx.assert(ctx.session, 500, 'A session is required to use @rill/load.')
    ctx.load = function load (name) {
      ctx.assert(_getters[name], 500, '@rill/load: Could not load getter [' + name + ']')
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
  var expire = opts.expire

  if (typeof name !== 'string') {
    throw new TypeError('@rill/load: Register options must have a name property.')
  }

  if (expire && typeof expire !== 'function') {
    throw new TypeError('@rill/load: Register expire option must be a function.')
  }

  if (typeof fn !== 'function') {
    throw new TypeError('@rill/load: Register arguments[1||2] must be a function.')
  }

  /**
   * A getter function that will load some data or return it from a cache.
   */
  _getters[name] = Object.defineProperty(function getter (ctx, args) {
    var key = name + JSON.stringify(args)
    var cache = ctx.session
    args = [ctx].concat(args)

    return Promise
      .resolve(expire && expire.apply(opts, args))
      .then(function checkCache (expired) {
        var exists = !expired && cache.has(key)
        return Promise
          // Check if we can used the cached data or load some new data.
          .resolve(exists ? cache.get(key) : fn.apply(opts, args))
          .then(function setLocals (data) {
            // If this was a new key we cache it.
            if (!exists) {
              cache.set(key, data, opts)
              cache.items[key].name = name
            }

            // Store data on locals for middleware access.
            ctx.locals[name] = data
            return data
          })
      })
  }, 'name', { value: name })
}
