import { graphql } from 'graphql'
import i18next from 'i18next'

import { i18nPromise } from '../i18n'
import { createLoaders } from '../loaders/createLoaders'
import schema from '../schema'

export const runQuery = async <TData = any, TVariables = Record<string, any>>(
  query: string,
  context: Partial<Omit<Context, 'loaders'>> = {},
  variables?: TVariables
): Promise<TData> => {
  await i18nPromise

  const loaders = createLoaders(context.user)

  const i18n = i18next.cloneInstance({ initImmediate: false, lng: 'en' })

  return graphql({
    schema,
    source: query,
    variableValues: variables,
    contextValue: {
      ...loaders,
      ...context,
      t: i18n.t.bind(i18n),
      language: i18n.language,
      languages: i18n.languages,
      i18n,
    },
  }).then((result) => {
    if (result.errors) {
      const [error] = result.errors
      throw error.originalError ?? error
    }

    return JSON.parse(JSON.stringify(result.data)) as TData
  })
}
