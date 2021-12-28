import type { GraphQLFieldConfig } from 'graphql'
import { GraphQLID } from 'graphql'
import { fromGlobalId } from 'graphql-relay'

import { DeckModel } from '../../mongo'
import { DeckStatisticsType } from './types'

interface DeckStatisticsArgs {
  deckId?: string
}

export const deckStatistics: GraphQLFieldConfig<
  void,
  Context,
  DeckStatisticsArgs
> = {
  type: DeckStatisticsType,
  description: 'Get the statistics for the given deck.',
  args: {
    deckId: { type: GraphQLID },
  },
  resolve: async (_, args, ctx) => {
    if (!ctx.user) {
      return null
    }

    let deck

    if (args.deckId) {
      const { id: deckId } = fromGlobalId(args.deckId)
      deck = await ctx.deckLoader.load(deckId)
    } else {
      deck = await DeckModel.findOne({ ownerId: ctx.user._id })
    }

    if (!deck) {
      console.error(
        args.deckId ? 'Deck not found' : 'User does not have any decks'
      )

      return null
    }

    return {
      deck,
    }
  },
}
