import express from 'express'
import helmet from 'helmet'
import i18next from 'i18next'
import i18nextMiddleware from 'i18next-http-middleware'
import morgan from 'morgan'

import config from './config'
import { i18nPromise } from './i18n'
import authMiddleware from './middlewares/auth'
import ioMiddleware from './middlewares/io'
import { getConnection } from './mongo/connection'
import router from './routes'

const start = async () => {
  await i18nPromise

  const app = express()

  if (process.env.NODE_ENV === 'production') {
    app.use(helmet())
    app.set('trust proxy', 1)
  }

  app.use(morgan('dev'))

  authMiddleware.set(router)
  ioMiddleware.set(router)

  app.use(i18nextMiddleware.handle(i18next))

  // Keep for backward compatibility
  app.use(router)

  app.use('/_c', router)

  try {
    await getConnection()
  } catch {
    process.exit(1)
  }

  app.listen(config.PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`App listening on https://localhost:${config.PORT}`)
  })
}

start()
