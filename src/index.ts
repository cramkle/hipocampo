import { promises as fsp } from 'fs'
import { join, relative } from 'path'

import express from 'express'
import helmet from 'helmet'
import i18next from 'i18next'
import Backend from 'i18next-fs-backend'
import i18nextMiddleware from 'i18next-http-middleware'
import morgan from 'morgan'

import config from './config'
import authMiddleware from './middlewares/auth'
import ioMiddleware from './middlewares/io'
import { getConnection } from './mongo/connection'
import router from './routes'

const start = async () => {
  const dir = await fsp.realpath(process.cwd())

  await i18next
    .use(Backend)
    .use(i18nextMiddleware.LanguageDetector)
    .init({
      supportedLngs: ['en', 'pt'],
      fallbackLng: 'en',
      ns: ['translation'],
      defaultNS: 'translation',
      backend: {
        loadPath: relative(
          dir,
          join(__dirname, 'locales', '{{lng}}', '{{ns}}.js')
        ),
      },
      detection: {
        lookupCookie: 'language',
        lookupHeader: 'accept-language',
      },
    })

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
