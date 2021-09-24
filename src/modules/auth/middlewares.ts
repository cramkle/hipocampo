import createStore from 'connect-redis'
import session from 'express-session'
import passport from 'passport'
import { Strategy as LocalStrategy } from 'passport-local'

import config from '../../config'
import type { UserDocument } from '../../mongo/User'
import UserModel from '../../mongo/User'
import { getRedisInstance } from '../../redis'
import { AnonymousStrategy } from './anonymousStrategy'

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

export async function auth() {
  const cookieOpts = {
    httpOnly: true,
    secure: false,
    maxAge: 365 * 24 * 60 * 60 * 1000,
    sameSite: 'strict' as const,
  }

  if (config.NODE_ENV === 'production') {
    cookieOpts.secure = true
  }

  const client = await getRedisInstance()

  return [
    session({
      name: 'sessid',
      store: new RedisStore({ client }),
      cookie: cookieOpts,
      secret: config.SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
    }),
    passport.initialize(),
    passport.session(),
  ]
}
