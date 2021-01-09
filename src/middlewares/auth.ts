import createStore from 'connect-redis'
import { IRouter } from 'express'
import session from 'express-session'
import passport from 'passport'
import { Strategy } from 'passport-local'
import redis from 'redis'

import config from '../config'
import UserModel, { UserDocument } from '../mongo/User'

const RedisStore = createStore(session)

passport.use(
  new Strategy(async (username: string, password: string, done) => {
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
    }

    if (config.NODE_ENV === 'production') {
      cookieOpts.secure = true
    }

    const client = redis.createClient({
      host: config.REDIS_HOST,
      port: config.REDIS_PORT,
      db: config.REDIS_DB,
    })

    client.unref()
    client.on('error', console.error)

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
