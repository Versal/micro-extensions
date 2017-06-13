import 'babel-polyfill'

import expect from 'expect'
import micro from 'micro'
import listen from 'test-listen'
import { parse as parseUrl } from 'url'

import createApiClient from '../createApiClient'

const runServer = server => {
  const service = micro(server)
  return listen(service)
}

describe('createApiClient', () => {
  it('returns the requested payload', async () => {
    const baseURL = await runServer((req, res) => {
      const { path } = parseUrl(req.url)
      return { ok: true, path }
    })

    const apiClient = createApiClient({ baseURL })
    const response = await apiClient.get('/foo')

    expect(response.data.ok).toBeTruthy()
    expect(response.data.path).toEqual('/foo')
  })

  it('injects headers', async () => {
    const baseURL = await runServer((req, res) => {
      return { ok: true, foo: req.headers.foo }
    })

    const apiClient = createApiClient({ baseURL, headers: { foo: 'bar' } })
    const response = await apiClient.get('/')

    expect(response.data.ok).toBeTruthy()
    expect(response.data.foo).toEqual('bar')
  })
})
