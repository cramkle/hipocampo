import type { Redis } from 'ioredis'
import RedisImpl from 'ioredis'

import config from './config'

let redisClient: Redis | null = null

export function getRedisInstance(): Redis {
  if (redisClient !== null) {
    return redisClient
  }

  const redisOptions = {
    host: config.REDIS_HOST,
    db: config.REDIS_DB,
    password: config.REDIS_PASSWORD,
  }

  const redisInstance = new RedisImpl({
    ...redisOptions,
  })

  redisClient = redisInstance

  redisClient.on('error', (error) => {
    console.error('[REDIS ERROR]', error)
  })

  return redisClient
}
