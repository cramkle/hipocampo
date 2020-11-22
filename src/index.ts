import express from 'express'
import helmet from 'helmet'
import morgan from 'morgan'

import config from './config'
import { getConnection } from './mongo/connection'
import router from './routes'

const app = express()

if (process.env.NODE_ENV === 'production') {
  app.use(helmet())
  app.set('trust proxy', 1)
}

app.use(morgan('dev'))

// Keep for backward compatibility
app.use(router)
app.use('/_c', router)

getConnection()
  .then(() => {
    app.listen(config.PORT, () => {
      // eslint-disable-next-line no-console
      console.log(`App listening on https://localhost:${config.PORT}`)
    })
  })
  .catch(() => {
    process.exit(1)
  })
