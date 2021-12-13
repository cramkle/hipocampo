import {
  GraphQLBoolean,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from 'graphql'
import { connectionFromArraySlice } from 'graphql-relay'

import { studyFlashcardsByDeck } from '../../modules/study/studySession'
import { DeckModel, NoteModel, UserModel } from '../../mongo'
import type { DeckDocument } from '../../mongo/Deck'
import type { NoteDocument } from '../../mongo/Note'
import { FlashcardStatus } from '../../mongo/Note'
import { graphQLGlobalIdField } from '../../utils/graphqlID'
import { getNoteIdentifier } from '../../utils/noteIdentifier'
import type { PageConnectionArgs } from '../../utils/pagination'
import {
  connectionWithCursorInfo,
  createPageCursors,
  pageToCursor,
} from '../../utils/pagination'
import { FieldValueType } from '../fieldValue/types'
import { FlashcardType } from '../flashcard/types'
import { ModelType } from '../model/types'
import { nodeInterface } from '../node/types'
import { UserType } from '../user/types'

export const NoteType: GraphQLObjectType<NoteDocument, Context> =
  new GraphQLObjectType<NoteDocument, Context>({
    name: 'Note',
    description: `
A note is what the user registers on each deck.

This type auto generates a number of cards, based
on the number of templates.
  `.trim(),
    interfaces: [nodeInterface],
    fields: () => ({
      id: graphQLGlobalIdField(),
      deck: {
        type: DeckType,
        description: 'Deck containing this note',
        resolve: (root, _, ctx) => ctx.deckLoader.load(root.deckId),
      },
      model: {
        type: ModelType,
        description: 'Model of this note',
        resolve: (root, _, ctx) => ctx.modelLoader.load(root.modelId),
      },
      values: {
        type: GraphQLNonNull(GraphQLList(GraphQLNonNull(FieldValueType))),
        description: 'Values of this note',
      },
      flashCards: {
        type: GraphQLNonNull(GraphQLList(GraphQLNonNull(FlashcardType))),
        description: 'Generated flashcards',
      },
      text: {
        type: GraphQLString,
        description: 'Note text representation',
        resolve: (root, _, ctx) => getNoteIdentifier(root, ctx),
      },
    }),
  })

type StudySessionDetailsObject = Map<FlashcardStatus, number>

export const StudySessionDetailsType = new GraphQLObjectType({
  name: 'StudySessionDetails',
  fields: {
    newCount: {
      type: GraphQLNonNull(GraphQLInt),
      resolve: (root: StudySessionDetailsObject) =>
        root.get(FlashcardStatus.NEW) ?? 0,
    },
    learningCount: {
      type: GraphQLNonNull(GraphQLInt),
      resolve: (root: StudySessionDetailsObject) =>
        root.get(FlashcardStatus.LEARNING) ?? 0,
    },
    reviewCount: {
      type: GraphQLNonNull(GraphQLInt),
      resolve: (root: StudySessionDetailsObject) =>
        root.get(FlashcardStatus.REVIEW) ?? 0,
    },
  },
})

const deckNoteConnection = connectionWithCursorInfo({
  nodeType: NoteType,
  connectionFields: {
    totalCount: { type: GraphQLNonNull(GraphQLInt) },
  },
})

export const DeckType: GraphQLObjectType = new GraphQLObjectType<
  DeckDocument,
  Context
>({
  name: 'Deck',
  description: 'Collection of notes',
  interfaces: [nodeInterface],
  fields: () => ({
    id: graphQLGlobalIdField(),
    title: {
      type: GraphQLNonNull(GraphQLString),
      description: 'Title of the deck',
    },
    description: {
      type: GraphQLString,
      description: 'Description of the deck',
    },
    slug: {
      type: GraphQLNonNull(GraphQLString),
      description: 'Unique identifiable slug',
    },
    owner: {
      type: UserType,
      description: 'Owner of the deck',
      resolve: (root) => UserModel.findById(root.ownerId),
    },
    originalDeck: {
      type: DeckType,
      description: 'Original deck',
      resolve: (root) => DeckModel.findById(root.originalDeckId),
    },
    isDeckInstalled: {
      type: GraphQLNonNull(GraphQLBoolean),
      description: 'Whether this deck is already installed for current user',
      resolve: (root, _, { user }) =>
        root.published &&
        DeckModel.findOne({
          originalDeckId: root._id,
          ownerId: user!._id,
        }).then((deck) => deck != null),
    },
    published: {
      type: GraphQLNonNull(GraphQLBoolean),
      description: 'Whether this deck is published to the marketplace',
    },
    studySessionDetails: {
      type: GraphQLNonNull(StudySessionDetailsType),
      description: 'Details of current study session',
      resolve: async (root, _, ctx) => {
        const studyFlashcards = await studyFlashcardsByDeck(root._id, ctx)

        const detailsObject: StudySessionDetailsObject = new Map()

        studyFlashcards.forEach((flashcard) => {
          const status =
            flashcard.status === FlashcardStatus.RELEARNING
              ? FlashcardStatus.LEARNING
              : flashcard.status

          detailsObject.set(status, (detailsObject.get(status) ?? 0) + 1)
        })

        return detailsObject
      },
    },
    notes: {
      type: deckNoteConnection.connectionType,
      description: 'Notes contained in this deck',
      args: {
        page: { type: GraphQLNonNull(GraphQLInt), defaultValue: 1 },
        size: { type: GraphQLNonNull(GraphQLInt), defaultValue: 10 },
        search: { type: GraphQLString },
      },
      resolve: (async (
        root: DeckDocument,
        args: PageConnectionArgs & { search?: string }
      ) => {
        const query = {
          deckId: root._id,
          ...(args.search && { $text: { $search: args.search } }),
        }
        const notesQuery = NoteModel.find(query)

        if (args.search) {
          notesQuery
            .select({ score: { $meta: 'textScore' } })
            .sort({ score: { $meta: 'textScore' } })
        }

        const paginationStart = (args.page - 1) * args.size

        const [totalCount, notes] = await Promise.all([
          NoteModel.find().merge(notesQuery).countDocuments(),
          notesQuery.skip(paginationStart).limit(args.size).exec(),
        ] as const)

        const cursor = pageToCursor(args.page, args.size)
        const connection = connectionFromArraySlice(
          notes,
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
      }) as any,
    },
    totalNotes: {
      type: GraphQLNonNull(GraphQLInt),
      description: 'Number of notes in this deck',
      resolve: (root, _, ctx) => ctx.countNotesByDeckLoader.load(root._id),
    },
    totalFlashcards: {
      type: GraphQLNonNull(GraphQLInt),
      description: 'Number of flashcards in this deck',
      resolve: (root, _, ctx) => ctx.countFlashcardsByDeckLoader.load(root._id),
    },
  }),
})
