import 'babel-polyfill'

import { createRouter, createApp, mountAt } from '../router'
import micro from 'micro'
import listen from 'test-listen'
import axios from 'axios'
import expect from 'expect'

const request = axios.create({ maxRedirects: 0, validateStatus: false })

describe('router', () => {
  describe('createApp', () => {
    it('creates micro compatible handler from routes', () => {
      const METHODS = [
        'get',
        'post',
        'put',
        'patch',
        'delete',
        'head',
        'options'
      ]

      const routes = METHODS.map(method => ({
        method,
        pattern: '/foo',
        handler: ({ req: { method } }) => ({ ok: true, method })
      }))

      for (const method of METHODS) {
        it(`handles ${method} requests`, async () => {
          const router = createRouter({ routes })
          const app = createApp(router)

          const url = await listen(micro(app))
          const response = await request[method](url + '/foo')

          expect(response.status).toEqual(200)
          if (response.data) {
            expect(response.data.method).toEqual(method.toUpperCase())
            expect(response.data.ok).toBeTruthy()
          }
        })
      }
    })
  })

  describe('createRouter', () => {
    it('injects url param values into handler context', async () => {
      const routes = [
        {
          method: 'get',
          pattern: '/foo/:typeOfFoo',
          handler: ({ params: { typeOfFoo } }) => ({ ok: true, typeOfFoo })
        }
      ]
      const router = createRouter({ routes })
      const app = createApp(router)
      const url = await listen(micro(app))
      const response = await request.get(url + '/foo/bar')

      expect(response.status).toEqual(200)
      expect(response.data.ok).toBeTruthy()
      expect(response.data.typeOfFoo).toEqual('bar')
    })

    it('injects url query values into handler context', async () => {
      const routes = [
        {
          method: 'get',
          pattern: '/foo',
          handler: ({ query: { typeOfBar } }) => ({ ok: true, typeOfBar })
        }
      ]
      const router = createRouter({ routes })
      const app = createApp(router)
      const url = await listen(micro(app))
      const response = await request.get(url + '/foo?typeOfBar=baz')

      expect(response.status).toEqual(200)
      expect(response.data.ok).toBeTruthy()
      expect(response.data.typeOfBar).toEqual('baz')
    })

    it('injects url pathname into handler context', async () => {
      const routes = [
        {
          method: 'get',
          pattern: '/baz',
          handler: ({ pathname }) => ({ ok: true, pathname })
        }
      ]
      const router = createRouter({ routes })
      const app = createApp(router)
      const url = await listen(micro(app))
      const response = await request.get(url + '/baz')

      expect(response.status).toEqual(200)
      expect(response.data.ok).toBeTruthy()
      expect(response.data.pathname).toEqual('/baz')
    })

    it('injects config object into handler context', async () => {
      const routes = [
        {
          method: 'get',
          pattern: '/',
          handler: ({ config: { foo } }) => ({ ok: true, foo })
        }
      ]
      const router = createRouter({ routes, config: { foo: 'bar' } })
      const app = createApp(router)
      const url = await listen(micro(app))
      const response = await request.get(url)

      expect(response.status).toEqual(200)
      expect(response.data.ok).toBeTruthy()
      expect(response.data.foo).toEqual('bar')
    })

    it('configures side effects helpers with access to the config object', async () => {
      const fooEffect = config => context => {
        return { get: () => Promise.resolve(context.config.foo) }
      }
      const routes = [
        {
          method: 'get',
          pattern: '/',
          handler: async ({ effects: { fooEffect } }) => {
            return {
              ok: true,
              foo: await fooEffect.get()
            }
          }
        }
      ]
      const router = createRouter({
        routes,
        config: { foo: 'bax' },
        effects: { fooEffect }
      })
      const app = createApp(router)

      const url = await listen(micro(app))
      const response = await request.get(url)

      expect(response.status).toEqual(200)
      expect(response.data.ok).toBeTruthy()
      expect(response.data.foo).toEqual('bax')
    })

    it('creates side effects helpers with access to req/res objects', async () => {
      const bazEffect = config => context => {
        return { get: () => Promise.resolve(context.req.headers.baz) }
      }
      const routes = [
        {
          method: 'get',
          pattern: '/',
          handler: async ({ effects: { bazEffect } }) => ({
            ok: true,
            foo: await bazEffect.get()
          })
        }
      ]
      const router = createRouter({ routes, effects: { bazEffect } })
      const app = createApp(router)
      const url = await listen(micro(app))
      const response = await request.get(url, { headers: { baz: 'boo' } })

      expect(response.status).toEqual(200)
      expect(response.data.ok).toBeTruthy()
      expect(response.data.foo).toEqual('boo')
    })
  })

  describe('mountAt', () => {
    it('mounts routes at subpath', async () => {
      const unmountedRoutes = [
        {
          method: 'get',
          pattern: '/unmounted',
          handler: () => ({ ok: true, mounted: false })
        }
      ]
      const mountedRoutes = mountAt('/prefix', [
        {
          method: 'get',
          pattern: '/mounted',
          handler: () => ({ ok: true, mounted: true })
        }
      ])
      const router = createRouter({
        routes: [
          ...unmountedRoutes,
          ...mountedRoutes
        ]
      })
      const app = createApp(router)
      const url = await listen(micro(app))

      const unmountedResponse = await request.get(url + '/unmounted')
      expect(unmountedResponse.status).toEqual(200)
      expect(unmountedResponse.data.ok).toBeTruthy()
      expect(unmountedResponse.data.mounted).toBeFalsy()

      const mountedResponse = await request.get(url + '/prefix/mounted')
      expect(mountedResponse.status).toEqual(200)
      expect(mountedResponse.data.ok).toBeTruthy()
      expect(mountedResponse.data.mounted).toBeTruthy()
    })
  })
})
