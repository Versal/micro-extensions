import Memcached from 'memcached-promisify'

const memcached = ({
  memcachedHost,
  memcachedHosts,
  memcachedOptions
}) => {
  const host = memcachedHost || memcachedHosts
  const memcached = new Memcached(host, memcachedOptions)
  return () => memcached
}

export default memcached
