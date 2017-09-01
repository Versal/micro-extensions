import 'babel-polyfill'

import { spy } from 'sinon'
import axios from 'axios'
import expect from 'expect'
import micro, { send } from 'micro'
import listen from 'test-listen'
import logRequests from '../logRequests'
import { createApp, configureRoutes } from '../../router'
import { suppressConsoleError } from '../../test'
import { IncomingMessage, ServerResponse } from 'http'

const request = axios.create({ maxRedirects: 0, validateStatus: false })

const runServer = (routes, effects) => {
  const router = configureRoutes(routes, { effects })
  const app = createApp(router)
  return listen(micro(app))
}

describe('logRequests', () => {
  suppressConsoleError()

  it('logs success', async () => {
    const fakeLogger = { debug: spy() }
    const loggerEffect = () => () => fakeLogger
    const routes = [{
      method: 'get',
      pattern: '/*',
      handler: logRequests(() => ({ ok: true }))
    }]
    const effects = { logger: loggerEffect }

    const endpointUrl = await runServer(routes, effects)
    await request.get(endpointUrl)

    const { req, res } = fakeLogger.debug.firstCall.args[0]
    expect(req).toBeA(IncomingMessage)
    expect(res).toBeA(ServerResponse)
    expect(res.statusCode).toEqual(200)
  })

  it('logs redirect', async () => {
    const fakeLogger = { debug: spy() }
    const loggerEffect = () => () => fakeLogger
    const routes = [{
      method: 'get',
      pattern: '/*',
      handler: logRequests(({ res }) => {
        res.setHeader('Location', 'http://google.com')
        send(res, 302)
      })
    }]
    const effects = { logger: loggerEffect }

    const endpointUrl = await runServer(routes, effects)
    await request.get(endpointUrl)

    const { req, res } = fakeLogger.debug.firstCall.args[0]
    expect(req).toBeA(IncomingMessage)
    expect(res).toBeA(ServerResponse)
    expect(res.statusCode).toEqual(302)
  })

  it('logs failure', async () => {
    const fakeLogger = { debug: spy() }
    const loggerEffect = () => () => fakeLogger
    const routes = [{
      method: 'get',
      pattern: '/*',
      handler: logRequests(({ res }) => {
        send(res, 400, { ok: false })
      })
    }]
    const effects = { logger: loggerEffect }

    const endpointUrl = await runServer(routes, effects)
    await request.get(endpointUrl)

    const { req, res } = fakeLogger.debug.firstCall.args[0]
    expect(req).toBeA(IncomingMessage)
    expect(res).toBeA(ServerResponse)
    expect(res.statusCode).toEqual(400)
  })

  it('logs unexpected', async () => {
    const fakeLogger = { debug: spy() }
    const loggerEffect = () => () => fakeLogger
    const routes = [{
      method: 'get',
      pattern: '/*',
      handler: logRequests(() => {
        throw new Error(`Test error, don't worry this is expected to happen`)
      })
    }]
    const effects = { logger: loggerEffect }

    const endpointUrl = await runServer(routes, effects)
    await request.get(endpointUrl)

    const { req, res } = fakeLogger.debug.firstCall.args[0]
    expect(req).toBeA(IncomingMessage)
    expect(res).toBeA(ServerResponse)
    expect(res.statusCode).toEqual(500)
  })
})
