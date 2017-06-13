import bunyan from 'bunyan'
import findIp from 'proxy-addr'

/* Instantiates a reasonable bunyan logger */

const createLogger = level => (
  bunyan.createLogger({
    level,
    name: 'master',
    stream: process.stdout,
    serializers: {
      err: bunyan.stdSerializers.err,
      req (req) {
        const ip = findIp(req, () => true)
        const { method, url } = req
        return { ip, method, url }
      },
      res (res) {
        return {
          status: res.statusCode
        }
      }
    }
  })
)

export default createLogger
