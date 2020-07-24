import { GraphQLFieldConfig, GraphQLString } from 'graphql'

import { checkAuthAndResolve } from '../../utils/auth'
import { studyFlashCardsByDeck } from '../../utils/study'
import { FlashCardType } from '../flashCard/types'

export const studyFlashCard: GraphQLFieldConfig<
  void,
  Context,
  { deckSlug: string }
> = {
  type: FlashCardType,
  description:
    'Retrieves the next flashcard for a study session in the given deck',
  args: {
    deckSlug: { type: GraphQLString },
  },
  resolve: checkAuthAndResolve(async (_, { deckSlug }, ctx) => {
    const deck = await ctx.deckBySlugLoader.load(deckSlug)

    if (!deck) {
      throw new Error('Deck not found')
    }

    const flashCards = await studyFlashCardsByDeck(deck._id, ctx)

    return flashCards[0]
  }),
}
