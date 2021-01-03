import fs from 'fs'
import { join, relative } from 'path'

import i18next from 'i18next'
import Backend from 'i18next-fs-backend'
import i18nextMiddleware from 'i18next-http-middleware'

const dir = fs.realpathSync(process.cwd())

export const i18nPromise = i18next
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
