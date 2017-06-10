// Inspired by https://github.com/pedronauck/micro-router

import flow from 'lodash/flow'
import mapValues from 'lodash/mapValues'
import values from 'lodash/values'
import invariant from 'invariant'
import configurePathMatch from 'path-match'
import { parse as parseUrl } from 'url'

// Configure path matching library
const createPathMatcher = configurePathMatch({
  sensitive: false,
  strict: false,
  end: false
})

// TODO write these
const routesValid = routes => true
const effectsValid = effects => true
const middlewaresValid = middlewares => true
const configValid = config => true

// Takes in all the ingredients for a router and outputs a new flattened
// set of routes that can be passed to `createApp`. This allows easy
// remixing of routes, effects, middlewares and configs.
export const createRouter = ({
  routes = [],
  effects = {},
  middlewares = [],
  config = {}
}) => {
  // TODO write these
  invariant(routesValid(routes), 'Routes are invalid')
  invariant(effectsValid(effects), 'Effects are invalid')
  invariant(middlewaresValid(middlewares), 'Middleware is invalid')
  invariant(configValid(config), 'Config is invalid')

  // Extract all the route info
  return routes.map(({
    method,
    handler,
    pattern,
    config: routeConfig = {},
    effects: routeEffects = {},
    middlewares: routeMiddlewares = []
  // Attach any found config, effects or middleware to the route
  }) => ({
    method,
    handler,
    pattern,
    config: { ...config, ...routeConfig },
    effects: { ...effects, ...routeEffects },
    middlewares: [ ...middlewares, ...routeMiddlewares ]
  }))
}

// Determines if a req matches a given route. When it does it returns context
// information about the URL. When it does not match it returns undefined.
const parseRequestForRoute = (req, route) => {
  const { url, method: requestMethod } = req
  const { pathMatcher, method: routeMethod } = route

  // Bail if the request type doesn't match
  if (![requestMethod, 'ALL'].includes(routeMethod.toUpperCase())) {
    return
  }

  // Check the URL against the route's `pathMatcher`. Since we get the `query`,
  // `params`, and `pathname` in the process we return them for later use.
  const { query, pathname } = parseUrl(url, true)
  const params = pathMatcher(pathname)

  // Done, return the url context or nothing
  if (params) {
    return { query, params, pathname }
  }
}

// A helper similar to lodash `mapValues` where the values might be promises
// that we want to run in parallel and update with the resolved values.
const mapResolvedPromiseValues = async promiseValues => {
  let results = {}
  await Promise.all(values(promiseValues))
  for (const key of Object.keys(promiseValues)) {
    results[key] = await promiseValues[key]
  }
  return results
}

// Apply one or more middlewares to handler
const applyMiddlewares = (handler, middlewares) => flow(...middlewares, handler)

// Pass in config object to each effect's configurator
const configureEffects = (config, effects) =>
  mapValues(effects, configurator => configurator(config))

// A helper for applying effect creators. The main point here is each effect
// needs a context object but the processing might be asynchronous.
const createEffects = async (context, creators) => {
  const effectsCreating = mapValues(creators, creator => creator(context))
  await Promise.all(values(effectsCreating))
  const effectsCreated = await mapResolvedPromiseValues(effectsCreating)

  return effectsCreated
}

// Take a set of routes and return a micro request handler
export const createApp = routes => {
  const invokableRoutes = routes.map(({
    method,
    pattern,
    handler,
    config,
    effects,
    middlewares
  }) => ({
    method,
    config,
    pathMatcher: createPathMatcher(pattern),
    handler: applyMiddlewares(handler, middlewares),
    effectCreators: configureEffects(config, effects)
  }))

  // Return a vanilla micro request handler
  return async (req, res) => {
    const requestContext = { req, res }

    // Check the request against each route
    for (const route of invokableRoutes) {
      // Parse the request against a given route. If there's a match we
      // get a url context object. Otherwise undefined is returned.
      const urlContext = parseRequestForRoute(req, route)
      if (urlContext) {
        const { handler, config, effectCreators } = route

        // Accumulate more context
        const routeContext = {
          config,
          ...urlContext,
          ...requestContext
        }

        // Each effect gets access to the full route context
        const effects =
          await createEffects(routeContext, effectCreators)

        // Handle request with "extended request handler" by handing it
        // the full route context
        const result = handler({ ...routeContext, effects })

        // Here we determine if the request has been handled or not, there
        // are two ways to know:
        // 1. In micro we'll always get a promise or object when a request is
        //    handled
        // 2. The reponse has been handled in some other way (e.g. `send()`)
        //    causing `res.headersSent` to be set to true
        if (result || res.headersSent) return result
      }
    }
  }
}

// Mount a set of routes at a prefixed path
// TODO add invariant that ensures patternPrefix doesn't have any placeholders
export const mountAt = (patternPrefix, routes) => (
  routes.map(route => ({
    ...route,
    pattern: `${patternPrefix}${route.pattern}`
  }))
)
