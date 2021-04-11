import type { SessionData } from 'express-session'
import { Store } from 'express-session'
import type { RedisClient } from 'redis'

// eslint-disable-next-line
const noop = () => {}

interface Options {
  client?: RedisClient
  prefix?: string
  ttl?: number
  disableTTL?: boolean
  disableTouch?: boolean
  scanCount?: number
}

export class SessionStore extends Store {
  private client: RedisClient
  private prefix: string
  private ttl: number
  private disableTTL: boolean
  private disableTouch: boolean
  private scanCount: number

  constructor(options: Options = {}) {
    super()

    if (!options.client) {
      throw new Error(
        'A redis client must be directly provided to the SessionStore'
      )
    }

    this.prefix = options.prefix ?? 'sess:'
    this.scanCount = options.scanCount ?? 100
    this.client = options.client
    this.ttl = options.ttl ?? 86400 // One day in seconds.
    this.disableTTL = options.disableTTL ?? false
    this.disableTouch = options.disableTouch ?? false
  }

  get(sid: string, cb: (err?: any, sess?: SessionData | null) => void = noop) {
    const key = this.prefix + sid

    this.client.get(key, (err, data) => {
      if (err) return cb(err)
      if (!data) return cb()

      let result
      try {
        result = JSON.parse(data)
      } catch (err) {
        return cb(err)
      }
      return cb(null, result)
    })
  }

  set(
    sid: string,
    sess: SessionData,
    cb: (err?: any, data?: any) => void = noop
  ) {
    const key = this.prefix + sid

    let value
    try {
      value = JSON.stringify(sess)
    } catch (er) {
      return cb(er)
    }

    if (!this.disableTTL) {
      // @ts-ignore
      this.client.set([key, value, 'EX', this._getTTL(sess).toString()], cb)

      return
    }

    this.client.set(key, value, cb)
  }

  touch(
    sid: string,
    sess: SessionData,
    cb: (err?: any, result?: string) => void = noop
  ) {
    if (this.disableTouch || this.disableTTL) return cb()
    const key = this.prefix + sid
    this.client.expire(key, this._getTTL(sess), (err, ret) => {
      if (err) return cb(err)
      if (ret !== 1) return cb(null, 'EXPIRED')
      cb(null, 'OK')
    })
  }

  destroy(sid: string, cb: (err?: any) => void = noop) {
    const key = this.prefix + sid
    this.client.del(key, cb)
  }

  clear(cb: (err?: any) => void = noop) {
    this._getAllKeys((err, keys) => {
      if (err) return cb(err)
      if (!keys) return cb(null)
      this.client.del(keys, cb)
    })
  }

  length(cb: (err: any, length: number) => void = noop) {
    this._getAllKeys((err, keys) => {
      if (err) return (cb as any)(err)
      if (!keys) return cb(null, 0)
      return cb(null, keys.length)
    })
  }

  ids(cb: (err: any, ids?: string[]) => void = noop) {
    const prefixLen = this.prefix.length

    this._getAllKeys((err, keys) => {
      if (err) return cb(err)
      if (!keys) return cb(null, [])
      keys = keys.map((key) => key.substr(prefixLen))
      return cb(null, keys)
    })
  }

  all(cb: (err?: any, keys?: SessionData[]) => void = noop) {
    const prefixLen = this.prefix.length

    this._getAllKeys((err, keys) => {
      if (err) return cb(err)
      if (keys == null || keys.length === 0) return cb(null, [])

      this.client.mget(keys, (err, sessions) => {
        if (err) return cb(err)

        let result
        try {
          result = sessions.reduce<SessionData[]>((accum, rawData, index) => {
            if (!rawData) return accum
            const data = JSON.parse(rawData) as SessionData
            ;(data as any).id = keys[index].substr(prefixLen)
            accum.push(data)
            return accum
          }, [])
        } catch (e) {
          err = e
        }
        return cb(err, result)
      })
    })
  }

  _getTTL(sess: SessionData) {
    let ttl
    if (sess?.cookie?.expires) {
      const ms = Number(new Date(sess.cookie.expires)) - Date.now()
      ttl = Math.ceil(ms / 1000)
    } else {
      ttl = this.ttl
    }
    return ttl
  }

  _getAllKeys(cb: (err?: any, keys?: string[]) => void = noop) {
    const pattern = this.prefix + '*'
    this._scanKeys({}, 0, pattern, this.scanCount, cb)
  }

  _scanKeys(
    keys: Record<string, boolean> = {},
    cursor: number | string,
    pattern: string,
    count: number,
    cb: (err?: any, keys?: string[]) => void = noop
  ) {
    this.client.scan(
      cursor.toString(),
      'match',
      pattern,
      'count',
      count.toString(),
      (err, data) => {
        if (err) return cb(err)

        const [nextCursorId, scanKeys] = data
        for (const key of scanKeys) {
          keys[key] = true
        }

        // This can be a string or a number. We check both.
        if (Number(nextCursorId) !== 0) {
          return this._scanKeys(keys, nextCursorId, pattern, count, cb)
        }

        cb(null, Object.keys(keys))
      }
    )
  }
}
