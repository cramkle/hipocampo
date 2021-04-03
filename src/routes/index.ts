import { json, urlencoded } from 'body-parser'
import cookieParser from 'cookie-parser'
import express from 'express'
import type { Request } from 'express'
import { graphqlHTTP } from 'express-graphql'

import config from '../config'
import { createLoaders } from '../loaders/createLoaders'
import { subscriptionRouter } from '../modules/subscription/routes'
import schema from '../schema'
import authRouter from './auth'

const router = express.Router()

const ioMiddlewares = [cookieParser(), json(), urlencoded({ extended: false })]

router.use(
  '/graphql',
  ...ioMiddlewares,
  graphqlHTTP((request) => {
    const req = request as Request
    const user = req.user

    return {
      schema,
      graphiql: config.NODE_ENV !== 'production',
      context: {
        ...createLoaders(user),
        user,
        t: req.t,
        language: req.language,
        languages: req.languages,
        i18n: req.i18n,
      } as Context,
    }
  })
)

router.use('/auth', ...ioMiddlewares, authRouter)

router.use('/subscription', subscriptionRouter)

export default router
