import { stringify as stringifyQuery } from 'querystring'

// Converts an axios payload object into a curl command string for
// debugging purposes. If the server is not in `production` mode it
// will add a debug message in `api-request` scope with a curl-based
// CLI command that can be copied/pasted into terminal, conversation
// or bug reports.

const curlCommandForRequest = ({
  baseURL,
  url,
  data,
  method,
  // Unsure what this is supposed to be but we need to parse a lot of stuff
  // out of it to make it useful
  headers: rawHeaders,
  params = {}
}) => {
  const curlParts = ['curl -v']

  // Avoid including this if you have a `--data` argument because curl
  // complains about the redundancy
  if (data && Object.keys(data).length) {
    curlParts.push(`--data '${JSON.stringify(data)}'`)
  } else {
    curlParts.push(`-X ${method.toUpperCase()}`)
  }

  // Pull out the headers that are not internal to axios
  const {
    common,
    delete: deleteHeader,
    get,
    head,
    post,
    put,
    patch,
    ...headers
  } = rawHeaders

  Object.keys(headers).forEach(key => {
    curlParts.push(`--header '${key}:${headers[key]}'`)
  })

  if (Object.keys(params).length) {
    url = `${url}?${stringifyQuery(params)}`
  }

  curlParts.push(`${url}`)

  return curlParts.join(' ')
}

export default curlCommandForRequest
