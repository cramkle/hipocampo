import type { GraphQLFieldConfig } from 'graphql'
import {
  GraphQLBoolean,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
} from 'graphql'
import { connectionFromArraySlice } from 'graphql-relay'

import { studyFlashcardsByDeck } from '../../modules/study/studySession'
import { DeckModel } from '../../mongo'
import type { PageConnectionArgs } from '../../utils/pagination'
import {
  connectionWithCursorInfo,
  createPageCursors,
  pageToCursor,
} from '../../utils/pagination'
import { DeckType } from './types'

interface DecksArgs {
  studyOnly: boolean
}

export const decks: GraphQLFieldConfig<void, Context, DecksArgs> = {
  type: GraphQLNonNull(GraphQLList(GraphQLNonNull(DeckType))),
  description: 'Retrieve all decks for the logged user',
  args: {
    studyOnly: {
      type: GraphQLNonNull(GraphQLBoolean),
      description: 'Whether or not to filter only for decks pending to study',
      defaultValue: false,
    },
  },
  resolve: async (_, { studyOnly }, ctx) => {
    if (!ctx.user) {
      return []
    }

    let decks = await DeckModel.find({ ownerId: ctx.user._id })

    if (studyOnly) {
      // eslint-disable-next-line require-atomic-updates
      decks = await Promise.all(
        decks.map((deck) =>
          studyFlashcardsByDeck(deck._id, ctx).then(
            (flashcards) => flashcards.length > 0
          )
        )
      ).then((results) => decks.filter((_, index) => results[index]))
    }

    return decks
  },
}
const deckConnection = connectionWithCursorInfo({
  nodeType: DeckType,
  connectionFields: {
    totalCount: { type: GraphQLNonNull(GraphQLInt) },
  },
})

export const publishedDecks: GraphQLFieldConfig<
  void,
  Context,
  PageConnectionArgs
> = {
  type: GraphQLNonNull(deckConnection.connectionType),
  description: 'Retrieve all published decks',
  args: {
    page: { type: GraphQLNonNull(GraphQLInt), defaultValue: 1 },
    size: { type: GraphQLNonNull(GraphQLInt), defaultValue: 10 },
  },

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  resolve: async (_, args: PageConnectionArgs, _ctx) => {
    const paginationStart = (args.page - 1) * args.size

    const [totalCount, publishedDecks] = await Promise.all([
      DeckModel.find({ published: true }).countDocuments(),
      DeckModel.find({ published: true })
        .skip(paginationStart)
        .limit(args.size)
        .exec(),
    ] as const)

    const cursor = pageToCursor(args.page, args.size)
    const connection = connectionFromArraySlice(
      publishedDecks,
      {
        after: cursor,
        first: args.size,
      },
      {
        sliceStart: paginationStart,
        arrayLength: totalCount,
      }
    )

    return Object.assign(
      {},
      {
        totalCount,
        pageCursors: createPageCursors(
          { page: args.page, size: args.size },
          totalCount
        ),
      },
      connection
    )
  },
}
