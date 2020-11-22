import bodyParser from 'body-parser'
import cookieParser from 'cookie-parser'
import { IRouter } from 'express'

export default {
  set: (app: IRouter) => {
    app.use(cookieParser())
    app.use(bodyParser.json())
  },
}
