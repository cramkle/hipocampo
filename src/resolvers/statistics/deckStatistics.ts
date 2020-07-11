import { GraphQLError, GraphQLFieldConfig, GraphQLID } from 'graphql'
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
    let deck

    if (args.deckId) {
      const { id: deckId } = fromGlobalId(args.deckId)
      deck = await ctx.deckLoader.load(deckId)
    } else {
      deck = await DeckModel.findOne({ ownerId: ctx.user?._id })
    }

    if (!deck) {
      throw new GraphQLError(
        args.deckId ? 'Deck not found' : 'User does not have any decks'
      )
    }

    return {
      deck,
    }
  },
}
