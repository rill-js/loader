<h1 align="center">
  <!-- Logo -->
  <img src="https://raw.githubusercontent.com/rill-js/rill/master/Rill-Icon.jpg" alt="Rill"/>
  <br/>
  @rill/loader
	<br/>

  <!-- Stability -->
  <a href="https://nodejs.org/api/documentation.html#documentation_stability_index">
    <img src="https://img.shields.io/badge/stability-stable-brightgreen.svg?style=flat-square" alt="API stability"/>
  </a>
  <!-- Standard -->
  <a href="https://github.com/feross/standard">
    <img src="https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square" alt="Standard"/>
  </a>
  <!-- NPM version -->
  <a href="https://npmjs.org/package/@rill/loader">
    <img src="https://img.shields.io/npm/v/@rill/loader.svg?style=flat-square" alt="NPM version"/>
  </a>
  <!-- Downloads -->
  <a href="https://npmjs.org/package/@rill/loader">
    <img src="https://img.shields.io/npm/dm/@rill/loader.svg?style=flat-square" alt="Downloads"/>
  </a>
  <!-- Gitter Chat -->
  <a href="https://gitter.im/rill-js/rill">
    <img src="https://img.shields.io/gitter/room/rill-js/rill.svg?style=flat-square" alt="Gitter Chat"/>
  </a>
</h1>

Utility to handle cached data loading in Rill.

# Installation

```console
npm install @rill/loader
```

# Example

#### Load the data in middleware.
```js
const app = require('rill')()
const loader = require('@rill/loader')

app.use(loader())
app.get('/my-view',
	(ctx, next)=> {
		// A #load function will be attached to the context.
		return ctx.load('myStuff', ...).then((myStuff)=> {
			// Loaded data cached automatically attached to ctx.locals
			ctx.locals.myStuff; //-> 'data'
		})
	}
)
```

#### Register a data loader.
```js
const loader = require('@rill/loader')

// Register a loadable item.
loader.register(
	{ name: 'myStuff', ttl: '30 minutes' },
	(ctx, ...)=> {
	    // Return any promise of data and it will be cached.
	    return myApi.fetchMyStuff();
	}
);
```

# API

###`ctx.load(name:String, arguments...)`
Requests data from a registered loader and returns cached data if possible.
`name` is the name of the loader and `arguments` are provided to the loader.

###`loader.register(opts:Object, getter:Function)`
Registers a getter function with the loader.
This function will be cached and automatically set it's data on `ctx.locals` when loaded.

#### Register Options
```js
{
	// The name where the data will be stored on `ctx.locals`.
	name: "myStuff",

	// A timeout (in milliseconds or as a string) that the data will deleted in.
	ttl: 3000,

	// If true the `ttl` option will be reset every time the data is loaded.
	refresh: false,

	// An optional function that can return true (or a promise that resolves to true) to delete the cached data.
	expire: (ctx, ...)=> {
		this //-> The `this` will be the options object.
		return myApi.checkIfStale(ctx.req.params.id)
	}
}
```

---

### Contributions

* Use `npm test` to run tests.

Please feel free to create a PR!
