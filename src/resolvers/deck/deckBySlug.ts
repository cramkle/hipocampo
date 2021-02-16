import type { GraphQLFieldConfig } from 'graphql'
import { GraphQLNonNull, GraphQLString } from 'graphql'

import { DeckType } from './types'

interface DeckArgs {
  slug: string
}

export const deck: GraphQLFieldConfig<void, Context, DeckArgs> = {
  type: DeckType,
  description: "Get single deck by it's slug",
  args: {
    slug: { type: GraphQLNonNull(GraphQLString) },
  },
  resolve: async (_, { slug }, ctx) => {
    return ctx.deckBySlugLoader.load(slug)
  },
}
