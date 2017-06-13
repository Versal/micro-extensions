import configureSession from '../modules/configureSession'

const session = config => {
  const createSession = configureSession(config)
  return ({ req, res }) => createSession({ req, res })
}

export default session
