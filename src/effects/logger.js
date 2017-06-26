import createLogger from '../modules/createLogger'

const logger = ({ logLevel }) => {
  const logger = createLogger(logLevel)

  // Side effects get access to the full app context but
  // we don't need it here
  return (/* context */) => logger
}

export default logger
