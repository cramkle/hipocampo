import { GraphQLID, GraphQLNonNull } from 'graphql'
import { fromGlobalId, mutationWithClientMutationId } from 'graphql-relay'

import { DeckModel, NoteModel } from '../../mongo'
import { DeckType } from './types'

export const deleteDeck = mutationWithClientMutationId({
  name: 'DeleteDeck',
  description: 'Delete a deck',
  inputFields: {
    id: { type: GraphQLNonNull(GraphQLID), description: 'Deck id' },
  },
  outputFields: {
    deck: { type: DeckType, description: 'Deleted deck' },
  },
  mutateAndGetPayload: async ({ id }, { user }: Context) => {
    if (!user) {
      return { deck: null }
    }

    const { id: deckId } = fromGlobalId(id)

    const deck = await DeckModel.findOne({ _id: deckId, ownerId: user._id })

    if (!deck) {
      throw new Error('Deck not found')
    }

    await NoteModel.deleteMany({ deckId: deck._id })

    await deck.remove()

    return {
      deck,
    }
  },
})
