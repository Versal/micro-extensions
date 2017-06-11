import 'babel-polyfill'

import { createRouter, createApp } from '../router'
import micro from 'micro'
import listen from 'test-listen'
import request from 'axios'

const invokeUrlNTimes = async (url, count) => {
  const start = Date.now()
  let i = 0
  while (i < count) {
    await request.get(url + '/foos')
    await request.get(url + '/foos/1')
    await request.get(url + '/foos/1/bars')
    await request.get(url + '/foos/1/bars/2')
    i = i + 1
  }
  const lapse = Date.now() - start
  return { lapse, count }
}

const main = async () => {
  const routes = [
    '/',
    '/foos',
    '/foos/:fooId',
    '/foos/:fooId/bars',
    '/foos/:fooId/bars/:barId'
  ].map(pattern => ({
    pattern,
    method: 'get',
    handler: ({ req, res, ...context }) => ({ ok: true, pattern, ...context })
  }))

  const router = createRouter({ routes, fooContext: true })
  const app = createApp(router)
  const url = await listen(micro(app))

  const count = 500
  let jobs = []
  let i = 0
  while (i < 5) {
    process.stdout.write('.')
    jobs = [...jobs, await invokeUrlNTimes(url, count)]
    i = i + 1
  }
  process.stdout.write('\n')

  console.info(`router: averages for requests in groups of ${count}`)
  console.info(jobs.map(({ lapse, count }) =>
    (lapse / count).toPrecision(2)
  ))

  process.exit()
}

main()
