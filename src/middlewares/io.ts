import bodyParser from 'body-parser'
import cookieParser from 'cookie-parser'
import type { IRouter } from 'express'

export default {
  set: (app: IRouter) => {
    app.use(cookieParser())
    app.use(bodyParser.json())
    app.use(bodyParser.urlencoded({ extended: false }))
  },
}
