import { IRouter, Request } from 'express'
import { graphqlHTTP } from 'express-graphql'

import config from '../config'
import { createLoaders } from '../loaders/createLoaders'
import schema from '../schema'

export default {
  set: (app: IRouter) => {
    app.use(
      '/graphql',
      graphqlHTTP((request) => {
        const user = (request as Request).user

        return {
          schema,
          graphiql: config.NODE_ENV !== 'production',
          context: {
            ...createLoaders(user),
            user,
          } as Context,
        }
      })
    )
  },
}
