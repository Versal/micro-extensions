import session from 'express-session'
import connectMemcached from 'connect-memcached'
const MemcachedStore = connectMemcached(session)

/*
 Wraps express middleware behind a promise-emitting facade for use
 in an "effect" implementation.

 Example usage:

 ```json
 const createSession = configureSession(config, store)
 const requestHandler = async (req, res) => {
   const session = await createSession(req, res)
   return { foo: session.get('foo') }
 }
 ```
*/

const getSessionFacade = req => ({
  get: key => req.session[key],
  set: (key, val) => (req.session[key] = val),
  setCookiePath: path => (req.session.cookie.path = path)
})

const configureSession = ({
  sessionNamespace,
  sessionCacheUri,
  sessionSecret,
  sessionExpiresMs
}) => {
  let store
  if (sessionNamespace && sessionCacheUri) {
    store = new MemcachedStore({
      prefix: `${sessionNamespace}-session-`,
      host: sessionCacheUri
    })
  }

  const middleware = session({
    store,
    name: `versal-${sessionNamespace}`,
    secret: sessionSecret,
    resave: false,
    saveUninitialized: true,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: sessionExpiresMs
    }
  })

  return ({ req, res }) => new Promise((resolve, reject) => {
    middleware(req, res, error => {
      if (error) return reject(error)
      resolve(getSessionFacade(req))
    })
  })
}

export default configureSession
