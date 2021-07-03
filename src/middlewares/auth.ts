import createStore from 'connect-redis'
import type { IRouter } from 'express'
import session from 'express-session'
import Redis from 'ioredis'
import passport from 'passport'
import { Strategy as LocalStrategy } from 'passport-local'

import config from '../config'
import { AnonymousStrategy } from '../modules/anonymousStrategy'
import type { UserDocument } from '../mongo/User'
import UserModel from '../mongo/User'

const RedisStore = createStore(session)

passport.use(
  new LocalStrategy(async (username: string, password: string, done) => {
    let user = null

    try {
      user = await UserModel.findOne({ username }).exec()
    } catch (e) {
      done(e)
      return
    }

    if (!user) {
      done(null, false, { message: 'Incorrect username' })
      return
    }

    if (!(await user.comparePassword(password))) {
      done(null, false, { message: 'Incorrect password' })
      return
    }

    return done(null, user)
  })
)

passport.use(new AnonymousStrategy())

passport.serializeUser((user: UserDocument, done) => {
  done(null, user._id)
})

passport.deserializeUser(async (id, done) => {
  let user = undefined

  try {
    user = (await UserModel.findOne({ _id: id }).exec()) ?? undefined
  } catch (e) {
    done(e)
    return
  }

  done(null, user)
})

export default {
  set: (app: IRouter) => {
    const cookieOpts = {
      httpOnly: true,
      secure: false,
      maxAge: 365 * 24 * 60 * 60 * 1000,
      sameSite: 'strict' as const,
    }

    if (config.NODE_ENV === 'production') {
      cookieOpts.secure = true
    }

    const redisOptions = {
      db: config.REDIS_DB,
      password: config.REDIS_PASSWORD,
    }

    const client = config.REDIS_REPLICA_HOST
      ? new Redis.Cluster(
          [
            {
              host: config.REDIS_HOST,
              port: config.REDIS_PORT,
            },
            {
              host: config.REDIS_REPLICA_HOST,
              port: config.REDIS_PORT,
            },
          ],
          {
            scaleReads: 'all',
            redisOptions,
          }
        )
      : new Redis({
          host: config.REDIS_HOST,
          port: config.REDIS_PORT,
          ...redisOptions,
        })

    client.on('error', (error) => {
      console.error('[REDIS ERROR]', error)
    })

    app.use(
      session({
        name: 'sessid',
        store: new RedisStore({ client }),
        cookie: cookieOpts,
        secret: config.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
      })
    )

    app.use(passport.initialize())
    app.use(passport.session())
  },
}
