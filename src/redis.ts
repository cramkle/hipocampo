import type { Redis } from 'ioredis'
import RedisImpl from 'ioredis'

import config from './config'

let redisClient: Redis | null = null

export async function getRedisInstance(): Promise<Redis> {
  if (redisClient !== null) {
    return redisClient
  }

  const redisOptions = {
    host: config.REDIS_HOST,
    db: config.REDIS_DB,
    password: config.REDIS_PASSWORD,
  }

  const redisInstance = new RedisImpl({
    ...(config.HAS_SENTINEL
      ? {
          sentinels: [
            { host: config.REDIS_HOST, port: config.REDIS_SENTINEL_PORT },
          ],
          sentinelPassword: config.REDIS_PASSWORD,
          name: config.REDIS_SENTINEL_NAME,
        }
      : null),
    ...redisOptions,
  })

  redisClient = redisInstance

  redisClient.on('error', (error) => {
    console.error('[REDIS ERROR]', error)
  })

  return redisClient
}
