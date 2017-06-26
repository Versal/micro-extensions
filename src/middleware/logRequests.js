const logRequests = handler => context => {
  const { req, res, effects: { logger } } = context
  const end = ::res.end
  const startTime = Date.now()

  res.end = (...args) => {
    const duration = Date.now() - startTime
    logger.debug({ req, res, duration })
    end(...args)
  }

  return handler(context)
}

export default logRequests
