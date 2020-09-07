import { GraphQLFieldConfig, GraphQLString } from 'graphql'

import { studyFlashcardsByDeck } from '../../modules/studySession'
import { FlashcardType } from '../flashcard/types'

export const studyFlashcard: GraphQLFieldConfig<
  void,
  Context,
  { deckSlug: string }
> = {
  type: FlashcardType,
  description:
    'Retrieves the next flashcard for a study session in the given deck',
  args: {
    deckSlug: { type: GraphQLString },
  },
  resolve: async (_, { deckSlug }, ctx) => {
    const deck = await ctx.deckBySlugLoader.load(deckSlug)

    if (!deck) {
      throw new Error('Deck not found')
    }

    const flashcards = await studyFlashcardsByDeck(deck._id, ctx)

    return flashcards[0]
  },
}
