import { promises as dns } from 'dns'

import type { Redis } from 'ioredis'
import redis from 'ioredis'

import config from './config'

let redisClient: Redis | null = null

let dnsResolvePromise: Promise<string[]> | null = null

export async function getRedisInstance(): Promise<Redis> {
  if (redisClient !== null) {
    return redisClient
  }

  const redisHosts = await (dnsResolvePromise ??
    (dnsResolvePromise = dns.resolve(config.REDIS_HOST, 'A')))

  if (redisClient !== null) {
    return redisClient
  }

  if (redisHosts.length > 1) {
    const sentinelInstance = new redis({
      sentinels: redisHosts.map((host) => ({
        host,
        port: config.REDIS_SENTINEL_PORT,
      })),
      sentinelPassword: config.REDIS_PASSWORD,
      host: config.REDIS_HOST,
      db: config.REDIS_DB,
      password: config.REDIS_PASSWORD,
      name: config.REDIS_SENTINEL_NAME,
    })

    redisClient = sentinelInstance
  } else {
    const redisInstance = new redis({
      host: config.REDIS_HOST,
      port: config.REDIS_PORT,
      db: config.REDIS_DB,
      password: config.REDIS_PASSWORD,
    })

    redisClient = redisInstance
  }

  redisClient.on('error', (error) => {
    console.error('[REDIS ERROR]', error)
  })

  return redisClient
}
