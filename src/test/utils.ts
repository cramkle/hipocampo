import { graphql } from 'graphql'

import { createLoaders } from '../loaders/createLoaders'
import schema from '../schema'

export const runQuery = <TData = any, TVariables = Record<string, any>>(
  query: string,
  context: Partial<Omit<Context, 'loaders'>> = {},
  variables?: TVariables
): Promise<TData> => {
  const loaders = createLoaders(context.user)

  return graphql({
    schema,
    source: query,
    variableValues: variables,
    contextValue: {
      ...loaders,
      ...context,
    },
  }).then((result) => {
    if (result.errors) {
      const [error] = result.errors
      throw error.originalError ?? error
    }

    return result.data! as TData
  })
}
