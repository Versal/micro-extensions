# Micro extensions

A small set of extensions for [Zeit](https://zeit.co/)'s [Micro](https://github.com/zeit/micr://github.com/zeit/micro)

Micro defines a great core set of primitives for building node endpoints that encourage minimalism. For many apps, even large ones, this is enough and that's part of what's wonderful about micro. This library provides additional functions that work on top of Micro's core.

## Principles

Micro extensions also extend Micro, which is very unopinionated, with one important principle:

_Side effects and state mutation must be isolated and explicit_

## Features

In addition to small helpers some big ticket items are provided. Everything is made to work well together or separately as much as possible.

### Rich handlers

Micro extensions embraces the concept of "rich handlers" which can be found in [Next.js](https://github.com/zeit/next.js). The idea is that instead of the typical NodeJS handler that accepts a `req` as its first argument and `res` as its second argument it receives a single context object with `req` and `res` as attributes.

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

The reason for this is to counteract the common approach across NodeJS frameworks of mutating the request object as a way for different parts of the application to coordinate (e.g. express session middleware adds a `session` attribute to `req` and expects you to find it by convention in your handler). There's no great problem with this but means your application depends on a "proprietary" `req` object and ultimately leads to indirection that make your application harder to reason about. On the other hand, by accepting a context object, libraries and frameworks can add to the context of the request without having to rely on mutating the `req` object to get work done. E.g. the application config can be made available to all requests:

```js
const configurableFooHandler = ({ req, res, config: { apiUrl } }) => ({
  apiUrl,
  ok: true
})
```

### Side effects

[Side effects](https://en.wikipedia.org/wiki/Side_effect_%28computer_science%29) are first class concepts that materialize as helpers called "effects" that are injected into your handlers at runtime. Some common effects are provided out of the box:

* Logger
* Session
* API client

### Middleware

Effects are favored over middleware as much as possible to encourage explicit interactions with the outside world inside you request handler code. With that said simple middleware is provided for common purposes:

* Request logger: provide default request logging for an app or set of routes
* Error page renderer: renders a react component server side with any uncaught error

### Config

Helpers for loading and validating application configurations.

### Router

A flexible router for declaratively wiring together rich handlers, effects, middleware and configs into applications.

* Routers can be combined to create larger applications
* Helpers make it easy to inject effects and apply middleware to all or a subset of routes

Example

```js
// A router
const fooRouter = createRouter({
  routes: [
    { method: 'get', pattern: '/foo', handler: fooHandler },
    { method: 'get', pattern: '/foo/fuzz', handler: fuzzHandler }
  ],
  effects: { fooEffect },
  middlewares: [ fooMiddlware ]
})

// Another router
const barRouter = createRouter({
  routes: [ { method: 'get', pattern: '/bar', handler: barHandler } ],
  middlewares: [ barMiddlware ],
})

// Combining routers
const router = createRouter({
  routes: [
    ...fooRouter,
    ...mountAt('/private', barRouter),
    fallbackRoute
  ],
  config: { secret: 'shutup' },
  effects: { logger: loggerEffect, apiClient: apiClientEffect },
  middlewares: [ logRequestsMiddleware ]
})

// Creating app
const app = createApp(router)

// Running app
micro(app).listen(2222)
```

### Documentation

Helpers for generating documentation from code.

## Usage

## API
