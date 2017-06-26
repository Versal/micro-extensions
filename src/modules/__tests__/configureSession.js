import 'babel-polyfill'

import axios from 'axios'
import micro from 'micro'
import { parse as parseCookie } from 'cookie'
import expect from 'expect'
import listen from 'test-listen'
import configureSession from '../configureSession'

const request = axios.create({
  // Don't redirect because we want to inspect the redirect response
  maxRedirects: 0,
  // Don't throw errors when a request fails, again we want to inspect the
  // response
  validateStatus: false
})

const createSession = configureSession({
  sessionNamespace: 'test',
  sessionSecret: 'tset',
  sessionExpiresMs: 1000
})

const runServer = server => {
  const service = micro(server)
  return listen(service)
}

describe('configureSession', () => {
  it('creates an anonymous session', async () => {
    const testHandler = async (req, res) => {
      await createSession({ req, res })
      return { ok: true }
    }
    const serverUrl = await runServer(testHandler)

    const response = await request.get(serverUrl)
    const cookieHeader = response.headers['set-cookie'].pop()
    const cookie = parseCookie(cookieHeader)

    // Sanity check
    expect(response.data.ok).toBeTruthy()
    // Expect a signed cookie string
    expect(cookie['versal-test'].slice(0, 2)).toEqual('s:')
  })

  it('sets a custom cookie path', async () => {
    const testHandler = async (req, res) => {
      const session = await createSession({ req, res })
      session.setCookiePath('/foo')
      return { ok: true }
    }
    const serverUrl = await runServer(testHandler)

    const response = await request.get(serverUrl)
    const cookieHeader = response.headers['set-cookie'].pop()
    const cookie = parseCookie(cookieHeader)

    // Sanity check
    expect(response.data.ok).toBeTruthy()
    // Check cookie path
    expect(cookie.Path).toEqual('/foo')
  })

  it('saves and retrieves session data', async () => {
    const testHandler = async (req, res) => {
      const session = await createSession({ req, res })

      if (req.url === '/set') {
        session.set('foo', 'bar')
        return { ok: true }
      }

      if (req.url === '/get') {
        const foo = session.get('foo')
        return { ok: true, foo }
      }

      // This shouldn't happen
      return { ok: false }
    }
    const serverUrl = await runServer(testHandler)

    // Make an initial request to /set that will set a value to the session
    const setResponse = await request.get(`${serverUrl}/set`)
    // Sanity check it
    expect(setResponse.data.ok).toBeTruthy()

    // Get the cookie from the first request
    const cookieHeader = setResponse.headers['set-cookie']
    // Make a second request to /set with the cookie
    const getResponse = await request.get(`${serverUrl}/get`, {
      headers: { Cookie: cookieHeader }
    })

    // Sanity check the response
    expect(getResponse.data.ok).toBeTruthy()
    // Make sure it can telegraph back the value from session
    expect(getResponse.data.foo).toEqual('bar')
  })
})
