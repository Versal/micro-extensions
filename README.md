# Micro extensions

Tools for building [Node.js](https://nodejs.org/) apps with [Zeit's](https://zeit.co/) [Micro](https://github.com/zeit/micro)

## Summary

Micro defines a set of powerful primitives for building endpoints with Node.js. Micro extensions provides additional functions and helpers that extend Micro's core making it easy to weave together small applications into larger ones.

_Note: we currently transpile using babel until Node.js 8 comes out then will deprecate transpiling and the need to reach into `lib/` to reach things that are not exported from `main`._

## Principles

Micro extensions also extend Micro, which is very unopinionated, with one important principle:

> _State mutation and other side-effects must be isolated and explicit_

## App example

```js
import { configureRoutes, createApp } from 'micro-extensions/lib'

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

## Features

Everything in Micro extensions is made to work well together or separately as much as possible.

### Router

A flexible router for declaratively composing request handlers, effects, middleware and application configs into applications.

* Routers can be combined to create larger applications
* Easy to inject effects and apply middleware to all or a subset of routes

See [router](#router-usage).

### Handlers

Request handlers accept a context object containing the familiar `req` and `res` as well as any applicable [effects]() and/or application [config](). This avoids the common Node.js practice of mutating the `req` object to maintian context and promotes explicit declaration of a request handler dependencies. See [request handlers](#request-handler-usage).

### Effects

[Side-effects](https://en.wikipedia.org/wiki/Side_effect_%28computer_science%29) are first class concepts that materialize in Micro extensions as helpers called "effects". Effects are injected into request handlers at runtime providing well defined interfaces over state mutations and other side-effects, e.g.:

```js
const createFooHandler = async ({ req, res, effects: { apiClient } }) => {
  return await apiClient.post('https://api.foo.com/foos', { bar: true })
}
```

Some common effects are provided out of the box:

* Logger
* Session
* API client

Effects have access to the request context and can also be used in [middleware](#middleware-usage). See [effects](#effects-usage).

### Middleware

Middleware are functions that wrap response handlers. Middleware have access to a full response handler [context object](#response-handler-context-object). See [middleware](#middleware-usage).

### Application config

Helpers for loading and validating application configurations. See [application config](#application-config-usage).

### Testing

The approach of Micro makes testing incredibly easy. Some helpers are provided to help reduce boilerplate. See [testing](#testing-usage).

### Documentation

A helper app is provided for generating documentation from code. See [documentation](#documentation-usage).

### Plugins

Reusable sub applications can be easily created by exporting a call to `configureRoutes` allowing you to package routes, effects, and middleware into a set of routes for reuse in larger applications which can supply the application configuration as well as additional effects and middleware. See [plugins](#plugins-usage).

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
  { method: 'all', pattern: '/*', handler: () => { throw createError(404, 'Not Found') } }
]
```

See [route declarations](#route-declarations) to learn about the structure of a route.

##### API

###### `configureRoutes(routes, { effects = {}, middlewares = [], config = {} })`

Configure a set of routes with effects, middleware and application config.

Arguments

* `routes` are an array of route definitions
* `effects` are a map of effect names to objects
* `middlewares` are an array of middleware functions
* `config` an application configuration objects

Returns

A flattened array of [route definitions](#route-definitions)

###### `createApp(routes)`

Creates a Micro-compatible handler from an array of route definitions.

Arguments

* `routes` are an array of route definitions

Returns

A Micro-compatible request handler

###### `mountAt(prefix, routes)`

Adds a path prefix to a set of routes.

Arguments

* `prefix` is string describing the path each route should be prefixed with.
  - Prefixes should not include parameters (TODO formalize this)
* `routes` are an array of route definitions

Returns

An array of route definitions

##### Route declarations

A route declaration describes a URL pattern and HTTP verb combination along with a handler for matching requests.

###### Fields

* `method` any [HTTP verb](https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods) or "all" to handle any verb
* `pattern` a url pathname [pattern](https://github.com/pillarjs/path-to-regexp#usage)
  - Named parameters are made available to request handlers via an object called `params`
* `handler` a [request handler](#request-handlers) to invoke for matching requests

### Middleware

Users are encouraged to consider if desired behavior can be achieved with effects because they encourage explicit calls inside requests handler code rather than introducing the indirection that comes with middleware. With that said it's easy to define new middleware when you want to apply some behavior to one more more routes unobtrusively, e.g.:

```js
const logMiddleware handler => ({ effects: { logger } }) => {
  logger.info('Yay, someone invoked me!')
}
```

Some generally useful middleware is provided

* Request logger: provide default request logging for an app or set of routes
* Error page renderer: renders a React component statically (server-side) with any uncaught error object

#### API

Arguments

* `handler` request handler to be wrapped by middleware

Returns a request handler

### Request handlers

Micro extensions embraces the concept of "rich request handlers" which can be found in [Next.js](https://github.com/zeit/next.js). The only difference is that instead of the typical Node.js request handler that accepts a `req` as its first argument and `res` as its second argument it receives a single context object with `req` and `res` as top-level attributes.

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

#### Request context fields

* `req` vanilla Node.js [request](https://nodejs.org/api/http.html#http_class_http_incomingmessage) object
* `res` vanilla Node.js [response](https://nodejs.org/api/http.html#http_class_http_serverresponse) object
* `query` object of key/value pairs [parsed](https://nodejs.org/docs/latest/api/url.html#url_url_parse_urlstring_parsequerystring_slashesdenotehost) out of the URL query string
* `params` object of key/value pairs parsed out of any [named parameters](https://github.com/component/path-to-regexp#named-parameters) in the requested URL
* `pathname` the [pathname](https://nodejs.org/docs/latest/api/url.html#url_url_pathname) of the requested URL
* `config` application config object [config](#config-usage) object
* `effects` object where the keys are the names of side-effects and the values are [effects](#effects-usage) helpers

#### Motivation for "rich request handlers"

Adopting the convention of passing a context object into a handler counteracts the common approach across Node.js frameworks of mutating the request object as a way for different parts of the application to coordinate (e.g. express session middleware adds a `session` attribute to `req` and expects you to find it by convention in handlers). There's no great problem with this but it forces your application to depend on a "proprietary" `req` object and ultimately leads to indirection that makes it harder to reason about. On the other hand, by accepting a context object, libraries (like the included router) can add to the context of the request without having to rely on reading/writing to the request object. E.g. the application config is made available to all requests as a top level key:

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

### Test helpers

##### API

###### `suppressConsoleError()`

Adds a `beforeEach` and `afterEach` to suppress all calls to `console.error` during test run. Used to quiet Micro tests that invoke `sendError`.

### Plugins

There's no specific documentation for plugins because to create one you simply export a call to `configureRoutes` from a module.

Some plugins ship with Micro extensions:

* Not found
* OpenAPI docs

## Inspiration

* [React](https://github.com/facebook/react)
* [Redux](https://github.com/reactjs/redux)
* [Redux-Saga](https://github.com/redux-saga/redux-saga)
* [Micro](https://github.com/zeit/micro)
* [Next.js](https://github.com/zeit/next.js)
