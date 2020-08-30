import express from 'express'
import helmet from 'helmet'
import morgan from 'morgan'

import config from './config'
import authMiddleware from './middlewares/auth'
import graphqlMiddleware from './middlewares/graphql'
import ioMiddleware from './middlewares/io'
import { getConnection } from './mongo/connection'
import authRouter from './routes/auth'

const app = express()

if (process.env.NODE_ENV === 'production') {
  app.use(helmet())
}

app.use(morgan('dev'))

ioMiddleware.set(app)
authMiddleware.set(app)
graphqlMiddleware.set(app)

app.use('/auth', authRouter)

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
