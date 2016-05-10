[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com/)
[![Chat about Rill at https://gitter.im/rill-js/rill](https://badges.gitter.im/rill-js/rill.svg)](https://gitter.im/rill-js/rill?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

# Rill Load
Utility to handle cached data loading in Rill.

# Installation

#### Npm
```console
npm install @rill/loader
```

# Example

#### Load the data in middleware.
```js
const app = rill();
const loader = require("@rill/loader")

app.use(loader())
app.get("/my-view",
	(ctx, next)=> {
		// A #load function will be attached to the context.
		return ctx.load("myStuff", ...).then((myStuff)=> {
			// Loaded data cached automatically attached to ctx.locals
			ctx.locals.myStuff; //-> "data"
		})
	}
)
```

#### Register a data loader.
```js
const loader = require("@rill/loader")

// Register a loadable item.
loader.register(
	{ name: "myStuff", ttl: "30 minutes" },
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
	refresh: false
}
```

---

### Contributions

* Use `npm test` to run tests.

Please feel free to create a PR!
