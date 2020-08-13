import { graphql } from 'graphql'

import { createLoaders } from '../loaders/createLoaders'
import schema from '../schema'

export const runQuery = (
  query: string,
  context: Partial<Omit<Context, 'loaders'>> = {},
  variables: Record<string, any> = {}
) => {
  const loaders = createLoaders(context.user)

  return graphql({
    schema,
    source: query,
    variableValues: variables,
    contextValue: {
      ...context,
      loaders,
    },
  }).then((result) => {
    if (result.errors) {
      const [error] = result.errors
      throw error.originalError ?? error
    }

    return result.data!
  })
}
