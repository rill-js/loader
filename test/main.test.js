'use strict'

var test = require('tape')
var agent = require('supertest').agent
var rill = require('rill')
var session = require('@rill/session')
var loader = require('../')

test('require options', function (t) {
  t.plan(5)
  t.throws(loader.register.bind(null, null, null), TypeError, 'Options are required.')
  t.throws(loader.register.bind(null, {}, noop), TypeError, 'Getter is required.')
  t.throws(loader.register.bind(null, { ttl: 30 }, noop), TypeError, 'Name is required.')
  t.throws(loader.register.bind(null, { name: 'test', expire: 'hi' }, noop), TypeError, 'Expire option must be a function.')
  t.doesNotThrow(loader.register.bind(null, { name: 'test' }, noop), TypeError, 'Works with valid options.')
  function noop () {}
})

test('loads constant data', function (t) {
  t.plan(4)

  var calls = 0
  var request = agent(rill()
    .use(session())
    .use(loader())
    .get('/', loadAndRespond('data'))
    .listen().unref())

  loader.register({
    name: 'data'
  }, function (ctx) {
    calls++
    return Promise.resolve('hello world')
  })

  // Request to load data.
  request
    .get('/')
    .expect(200)
    .then(function (res) {
      t.equals(calls, 1, 'fetched from getter')
      t.equals(res.text, 'hello world', 'loaded data from getter')

      // Request to verify it was cached.
      request
        .get('/')
        .expect(200)
        .then(function (res) {
          t.equals(calls, 1, 'fetched from cache')
          t.equals(res.text, 'hello world', 'loaded data from getter')
        }, t.fail)
    }, t.fail)
})

test('clears expired ttl data', function (t) {
  t.plan(6)

  var calls = 0
  var request = agent(rill()
    .use(session())
    .use(loader())
    .get('/', loadAndRespond('data'))
    .listen().unref())

  loader.register({
    name: 'data',
    ttl: '100 ms'
  }, function (ctx) {
    calls++
    return Promise.resolve('hello world')
  })

  // Request to load data.
  request
    .get('/')
    .expect(200)
    .then(function (res) {
      t.equals(calls, 1, 'fetched from getter')
      t.equals(res.text, 'hello world', 'loaded data from getter')

      // Request to verify it was cached.
      request
        .get('/')
        .expect(200)
        .then(function (res) {
          t.equals(calls, 1, 'fetched from cache')
          t.equals(res.text, 'hello world', 'loaded data from getter')
        }, t.fail)

      // Request to verify cache cleared after 100ms
      setTimeout(function () {
        request
          .get('/')
          .expect(200)
          .then(function (res) {
            t.equals(calls, 2, 'fetched from getter again')
            t.equals(res.text, 'hello world', 'loaded data from getter')
          }, t.fail)
      }, 101)
    }, t.fail)
})

test('clears expired data with custom expire function', function (t) {
  t.plan(6)

  var calls = 0
  var request = agent(rill()
    .use(session())
    .use(loader())
    .get('/', loadAndRespond('data'))
    .listen().unref())

  loader.register({
    name: 'data',
    expire: function (ctx) {
      // Custom expire function that expires the cached value whenever a clear query string is passed.
      return ctx.req.query.clear
    }
  }, function (ctx) {
    calls++
    return Promise.resolve('hello world')
  })

  // Request to load data.
  request
    .get('/')
    .expect(200)
    .then(function (res) {
      t.equals(calls, 1, 'fetched from getter')
      t.equals(res.text, 'hello world', 'loaded data from getter')

      // Request to verify it was cached.
      request
        .get('/')
        .expect(200)
        .then(function (res) {
          t.equals(calls, 1, 'fetched from cache')
          t.equals(res.text, 'hello world', 'loaded data from getter')

          // Request that will manually clear the cache with the query string.
          request
            .get('/')
            .query({ clear: true })
            .expect(200)
            .then(function (res) {
              t.equals(calls, 2, 'fetched from getter again')
              t.equals(res.text, 'hello world', 'loaded data from getter')
            }, t.fail)
        }, t.fail)
    }, t.fail)
})

// Simple util to auto respond with loaded data.
function loadAndRespond (name) {
  return function (ctx, next) {
    return ctx.load(name).then(function () {
      ctx.res.body = ctx.locals[name]
    })
  }
}
