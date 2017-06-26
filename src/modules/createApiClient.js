import axios from 'axios'
import curlCommandForRequest from './curlCommandForRequest'
import configureDebug from 'debug'

const debug = configureDebug('api-request')

/*
Instantiates useful api client over the axios request library

APIs:

Interface: https://github.com/mzabriskie/axios#request-method-aliases
Requests: https://github.com/mzabriskie/axios#request-config
Responses: https://github.com/mzabriskie/axios#response-schema
*/

const createApiClient = config => {
  const api = axios.create(config)

  if (process.env.NODE_ENV !== 'production') {
    api.interceptors.request.use(config => {
      debug(curlCommandForRequest(config))
      return config
    })
  }

  return api
}

export default createApiClient
