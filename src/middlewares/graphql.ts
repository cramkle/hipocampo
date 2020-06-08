import { Application, Request } from 'express'
import graphqlHTTP from 'express-graphql'

import { createLoaders } from '../loaders/createLoaders'
import schema from '../schema'

export default {
  set: (app: Application) => {
    app.use(
      '/graphql',
      graphqlHTTP((request) => {
        const user = (request as Request).user

        return {
          schema,
          graphiql: true,
          context: {
            ...createLoaders(user),
            user,
          } as Context,
        }
      })
    )
  },
}
