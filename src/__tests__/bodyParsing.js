import 'babel-polyfill'

import axios from 'axios'
import micro from 'micro'
import expect from 'expect'
import listen from 'test-listen'
import { text, json, buffer, urlencoded } from '../bodyParsing'
import querystring from 'querystring'

const request = axios.create({
  // Don't redirect because we want to inspect the redirect response
  maxRedirects: 0,
  // Don't throw errors when a request fails, again we want to inspect the
  // response
  validateStatus: false
})

const runServer = server => listen(micro(server))

// Note: It's pretty hard to test that values are cached across invocations
// so we only test that the underlying mechanisms that we pass through to
// are in working order

describe('bodyParsing', () => {
  it('parses text body', async () => {
    const apiUrl = await runServer(async (req, res) => {
      const foo = await text(req)
      return { ok: true, foo }
    })

    const response = await request.post(apiUrl, 'bar')

    expect(response.data.ok).toBeTruthy()
    expect(response.data.foo).toEqual('bar')
  })

  it('parses json body', async () => {
    const apiUrl = await runServer(async (req, res) => {
      const foo = await json(req)
      return { ok: true, foo }
    })

    const response = await request.post(apiUrl, { foo: 'bar' })

    expect(response.data.ok).toBeTruthy()
    expect(response.data.foo).toEqual({ foo: 'bar' })
  })

  it('parses body as buffer', async () => {
    const apiUrl = await runServer(async (req, res) => {
      const foo = await buffer(req)
      return { ok: true, foo: foo.toString() }
    })

    const response = await request.post(apiUrl, 'bar')

    expect(response.data.ok).toBeTruthy()
    expect(response.data.foo).toEqual('bar')
  })

  it('parses urlencoded body', async () => {
    const apiUrl = await runServer(async (req, res) => {
      const foo = await urlencoded(req)
      return { ok: true, foo }
    })

    const response = await request
      .post(apiUrl, querystring.stringify({ foo: 'bar' }))

    expect(response.data.ok).toBeTruthy()
    expect(response.data.foo).toEqual({ foo: 'bar' })
  })
})
