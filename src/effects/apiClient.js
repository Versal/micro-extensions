import createApiClient from '../modules/createApiClient'

const apiClient = config => {
  const api = createApiClient(config)
  // Side effects get access to the full app context but
  // we don't need it here
  return (/* context */) => api
}

export default apiClient
