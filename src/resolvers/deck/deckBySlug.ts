import { GraphQLFieldConfig, GraphQLNonNull, GraphQLString } from 'graphql'

import { checkAuthAndResolve } from '../../utils/auth'
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
  resolve: checkAuthAndResolve(async (_, { slug }, ctx) => {
    return ctx.deckBySlugLoader.load(slug)
  }),
}
