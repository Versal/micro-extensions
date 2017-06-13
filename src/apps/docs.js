import { sendHtml, sendJson } from '../modules/sendContentTypes'
import { renderToStaticMarkup } from 'react-dom/server'
import toPairs from 'lodash/toPairs'
import React from 'react'

const Path = ({
  pattern,
  verb,
  pathParameters = [],
  queryParameters = [],
  method: { summary, operationId }
}) => (
  <div key={verb}>
    <h3>
      <pre>
        <a name={operationId} />
        {verb.toUpperCase()} {pattern}
      </pre>
    </h3>
    <p>{summary}</p>

    {!!pathParameters.length && (
      <Parameters
        title='Path params'
        params={pathParameters} />
    )}

    {!!queryParameters.length && (
      <Parameters
        title='Query params'
        params={queryParameters} />
    )}
  </div>
)

const Parameters = ({ title, params }) => (
  <div>
    <h4>{title}</h4>

    <table className='pure-table'>
      <thead>
        <tr>
          <th>name</th>
          <th>description</th>
          <th>type</th>
          <th>required</th>
          <th>default</th>
        </tr>
      </thead>

      <tbody>
        {params.map(({
          name,
          description,
          required,
          schema: { type },
          default: defaultValue
        }) => (
          <tr key={name}>
            <td><pre>{name}</pre></td>
            <td>{description}</td>
            <td>{type}</td>
            <td>{required ? 'yes' : 'no'}</td>
            <td><pre>{defaultValue === undefined ? '-' : defaultValue}</pre></td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)

const Paths = ({ paths }) => (
  <div>
    {paths.map(path => (
      <Path key={`${path.verb}-${path.pattern}`} {...path} />
    ))}
  </div>
)

const Config = ({ params }) => (
  <Parameters
    title='Parameters'
    params={params} />
)

const OpenApi = ({
  info,
  servers,
  paths,
  'x-config': configParams
}) => (
  <html>
    <head>
      <title>{info.title}</title>
      <link rel='stylesheet' href='https://unpkg.com/purecss@0.6.2/build/pure-min.css' />
    </head>
    <body style={{ margin: '10 30' }}>
      <div>
        <h1>{info.title}</h1>
        <p>{info.description} (v{info.version})</p>
        <h2>Paths</h2>
        <Paths paths={paths} />
        <h2>Configuration</h2>
        <Config params={configParams} />
      </div>
    </body>
  </html>
)

// Transforms e.g. `/foo/:fooId` to `/foo/{fooId}`
const openApiPatternFromRoutePattern = pattern => pattern
  .split('/')
  .map(s => s.startsWith(':') ? `{${s.slice(1)}}` : s)
  .join('/')

const openApiPathsFromRoutes = apiRoutes => {
  return apiRoutes.reduce((paths, { handler, pattern, method }) => {
    if (!handler.schema) return
    const openApiPattern = openApiPatternFromRoutePattern(pattern)
    paths[openApiPattern] = paths[openApiPattern] || {}
    paths[openApiPattern][method.toLowerCase()] = handler.schema
    return paths
  }, {})
}

const flattenOpenApiSchemaForDisplay = openApiSchema => {
  let paths = []
  toPairs(openApiSchema.paths).forEach(pathPair => {
    const [pattern, methods] = pathPair
    toPairs(methods).forEach(methodPair => {
      const [verb, method] = methodPair
      paths = [...paths, {
        verb,
        method,
        pattern,
        queryParameters:
          method.parameters.filter(p => p.in === 'query'),
        pathParameters:
          method.parameters.filter(p => p.in === 'path')
      }]
    })
  })

  return { ...openApiSchema, paths }
}

export const createDocs = (schema, appRoutes) => {
  const openApiSchema = {
    ...schema,
    paths: openApiPathsFromRoutes(appRoutes)
  }

  const openApiSchemaForDisplay =
    flattenOpenApiSchemaForDisplay(openApiSchema)

  const openApiHtml =
    renderToStaticMarkup(<OpenApi {...openApiSchemaForDisplay} />)

  const routes = [{
    method: 'get',
    pattern: '/docs.json',
    handler: ({ res }) => sendJson(res, 200, openApiSchema)
  }, {
    method: 'get',
    pattern: '/docs',
    handler: ({ res }) => sendHtml(res, 200, openApiHtml)
  }]

  return routes
}
