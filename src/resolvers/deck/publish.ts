import { GraphQLID, GraphQLNonNull } from 'graphql'
import { fromGlobalId, mutationWithClientMutationId } from 'graphql-relay'

import { DeckModel } from '../../mongo'
import { DeckType } from './types'

export const publishDeck = mutationWithClientMutationId({
  name: 'PublishDeck',
  description: 'Publish a deck to the marketplace',
  inputFields: {
    id: {
      type: GraphQLNonNull(GraphQLID),
      description: 'Id of the deck to publish',
    },
  },
  outputFields: { deck: { type: DeckType } },
  mutateAndGetPayload: async ({ id }, { user }: Context) => {
    if (!user || user.anonymous)
      throw new Error('An anonymous can not publish a deck.')

    const { id: deckId } = fromGlobalId(id)

    const deck = await DeckModel.findOne({
      _id: deckId,
      ownerId: user._id,
    })

    if (!deck) {
      return { deck: null }
    }

    if (deck.originalDeckId != null) {
      throw new Error('Cannot re-publish deck from marketplace')
    }

    deck.published = true

    await deck.save()

    return {
      deck,
    }
  },
})

export const unpublishDeck = mutationWithClientMutationId({
  name: 'UnpublishDeck',
  description: 'Unpublish a deck from the marketplace',
  inputFields: {
    id: {
      type: GraphQLNonNull(GraphQLID),
      description: 'Id of the deck to remove from marketplace',
    },
  },
  outputFields: { deck: { type: DeckType } },
  mutateAndGetPayload: ({ id }, { user }: Context) => {
    const { id: deckId } = fromGlobalId(id)

    return {
      deck: DeckModel.findOneAndUpdate(
        { _id: deckId, ownerId: user?._id },
        { published: false },
        {
          new: true,
        }
      ),
    }
  },
})
