import type { Request } from 'express'
import { graphqlHTTP } from 'express-graphql'
import { formatError } from 'graphql'

import config from '../config'
import { createLoaders } from '../loaders/createLoaders'
import schema from '../schema'

export function graphql() {
  return graphqlHTTP((request) => {
    const req = request as Request
    const user = req.user

    return {
      schema,
      graphiql: config.NODE_ENV !== 'production',
      customFormatErrorFn: (error) => {
        console.error(error)

        return formatError(error)
      },
      context: {
        ...createLoaders(user),
        user,
        t: req.t,
        language: req.language,
        languages: req.languages,
        i18n: req.i18n,
      } as Context,
    }
  })
}
