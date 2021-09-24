import express from 'express'
import promBundle from 'express-prom-bundle'
import helmet from 'helmet'
import i18next from 'i18next'
import i18nextMiddleware from 'i18next-http-middleware'

import pkg from '../package.json'
import config from './config'
import { i18nPromise } from './i18n'
import { io } from './middlewares/io'
import { logger } from './middlewares/logger'
import { auth } from './modules/auth/middlewares'
import { getConnection } from './mongo/connection'
import router from './routes'
import healthzRouter from './routes/healthz'

const start = async () => {
  await i18nPromise

  const app = express()

  app.use(
    promBundle({
      includeMethod: true,
      customLabels: {
        app: 'hipocampo',
        version: pkg.version,
      },
      promClient: {
        collectDefaultMetrics: {},
      },
    })
  )

  if (process.env.NODE_ENV === 'production') {
    app.use(helmet())
    app.set('trust proxy', 1)
  }

  app.use(healthzRouter)

  app.use(logger())

  app.use(await auth())
  app.use(io())

  app.use(i18nextMiddleware.handle(i18next))

  // Kept for backward compatibility
  app.use(router)

  app.use('/_c', router)
  app.use('/api', router)

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
