import { createError } from 'micro'
import { configureRoutes } from '../../router'

const notFound = configureRoutes([{
  method: 'all',
  pattern: '/*',
  handler: () => { throw createError(404, 'Not Found') }
}])

export default notFound
