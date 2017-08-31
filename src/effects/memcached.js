import Memcached from 'memcached-promisify'

const memcached = ({
  memcachedHosts,
  memcachedOptions
}) => {
  const memcached = new Memcached(memcachedHosts, memcachedOptions)
  return () => memcached
}

export default memcached
