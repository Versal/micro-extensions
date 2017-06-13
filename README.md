# Micro extensions

Tools for building [Node.js](https://nodejs.org/) apps with [Zeit's](https://zeit.co/) [Micro](https://github.com/zeit/micro)

## Summary

Micro defines a great core set of primitives for building endpoints with NodeJS. Micro extensions provides additional functions and helpers that extend Micro's core making it easier to build larger services by weaving together smaller parts, isolating side effects and promoting functional programming idioms.

```js
const routes = configureRoutes({
  routes: [
    { method: 'get', pattern: '/foo', handler: fooHandler },
    { method: 'get', pattern: '/foo/fuzz', handler: fuzzHandler },
    ...notFoundRoutes
  ],
  effects: { database },
  middlewares: [ logRequests ]
})

const app = createApp(routes)

micro(app).listen(2222)
```

## Principles

Micro extensions also extend Micro, which is very unopinionated, with one important principle:

> _Side effects and state mutation must be isolated and explicit_

## Features

Everything in Micro extensions is made to work well together or separately as much as possible.

### Router

A flexible router for declaratively composing rich handlers, effects, middleware and configs into applications.

* Routers can be combined to create larger applications
* Easy to inject effects and apply middleware to all or a subset of routes

See [Router](#router-usage)

### Effects

[Side effects](https://en.wikipedia.org/wiki/Side_effect_%28computer_science%29) are first class concepts that materialize Micro in extensions as helpers called "effects". Effects are injected into request handlers at runtime providing well defined interfaces over state mutations and other side effects. Some common effects are provided out of the box:

* Logger
* Session
* API client

See [Effects](#effects-usage) and [Creating your own effects](#creating-your-own-effects)

### Middleware

Effects are favored over middleware as much as possible to encourage explicit calls inside you request handler code rather than introducing the indirection that comes with middleware. With that said simple middleware is provided for common purposes:

* Request logger: provide default request logging for an app or set of routes
* Error page renderer: renders a react component server side with any uncaught error

See [middleware](#middleware-usage)

### Config

Helpers for loading and validating application configurations.

See [config](#config-usage)

### Testing

The approach of Micro makes testing incredibly easy. Some helpers are provided to help reduce boilerplate.

See [testing](#testing-usage)

### Documentation

A helper app is provided for generating documentation from code.

See [documentation](#documentation-usage)

## Usage

### <a name="router-usage" /> Router

#### Routes

Routes are arrays of route declarations. Each route declares an HTTP method, a path pattern, and a handler to invoke for matching requests, e.g.:

```js
const routes = [
  {
    method: 'get',
    pattern: '/foo/:fooId',
    handler: ({ params: { fooId } }) => ({ ok: true, fooId })
  },
  { method: 'all', pattern: '/*', handler: () => { throw createNotFoundError() } }
]
```

See [route declarations](#route-declarations) to learn about the structure of a route.

##### API

###### `configureRoutes(routes, { effects = {}, middlewares = [], config = {} })`

Configure a set of routes with effects, middleware and application config.

* `routes` are an array of route definitions
* `effects` are a map of effect names to objects
* `middlewares` are an array of middleware functions
* `config` an application configuration objects
* Returns a flattened array of route definitions

###### `createApp(routes)`

Creates a Micro-compatible handler from an array of route definitions.

* `routes` are an array of route definitions
* Returns a Micro-compatible request handler

###### `mountAt(prefix, routes)`

Adds a path prefix to a set of routes

* `prefix` is string describing the path each route should be prefixed with.
  - Prefixes should not include parameters (TODO formalize this)
* `routes` are an array of route definitions
* Returns an array of route definitions

##### Route declarations

A route declaration decribes a URL pattern and HTTP verb combination along with a handler for matching requests.

###### Fields

* `method` any HTTP verb or "all" to handle any verb
* `pattern` a url pathname pattern
  - Named parameters are made available to request handlers via an object called `params`
  - See [path-to-regexp] for possible patterns
* `handler` a [rich request handler](#rich-request-handlers) for handling matching requests

## Concepts

### Rich request handlers

Micro extensions embraces the concept of "rich request handlers" which can be found in [Next.js](https://github.com/zeit/next.js). The idea is that instead of the typical NodeJS handler that accepts a `req` as its first argument and `res` as its second argument it receives a single context object with `req` and `res` as attributes.

Before:

```js
const fooHandler = (req, res) => ({ ok: true })
```

After:

```js
const richFooHandler = ({ req, res, query }) => ({
  ok: true,
  foo: query.foo
})
```

The reason for this is to counteract the common approach across NodeJS frameworks of mutating the request object as a way for different parts of the application to coordinate (e.g. express session middleware adds a `session` attribute to `req` and expects you to find it by convention in handlers). There's no great problem with this but means your application depends on a "proprietary" `req` object and ultimately leads to indirection that make your application harder to reason about. On the other hand, by accepting a context object, libraries and frameworks can add to the context of the request without having to rely on mutating the `req` object to get work done. E.g. the application config can be made available to all requests:

```js
const configurableFooHandler = ({
  req,
  res,
  config: { apiUrl }
}) => ({
  apiUrl,
  ok: true
})
```
