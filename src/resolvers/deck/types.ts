import {
  GraphQLBoolean,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from 'graphql'
import { connectionFromArraySlice } from 'graphql-relay'

import { NoteModel, UserModel } from '../../mongo'
import { DeckDocument } from '../../mongo/Deck'
import { FlashCardStatus, NoteDocument } from '../../mongo/Note'
import { graphQLGlobalIdField } from '../../utils/graphqlID'
import { getNoteIdentifier } from '../../utils/noteIdentifier'
import {
  PageConnectionArgs,
  connectionWithCursorInfo,
  createPageCursors,
  pageToCursor,
} from '../../utils/pagination'
import { studyFlashCardsByDeck } from '../../utils/study'
import { FieldValueType } from '../fieldValue/types'
import { FlashCardType } from '../flashCard/types'
import { ModelType } from '../model/types'
import { nodeInterface } from '../node/types'
import { UserType } from '../user/types'

export const NoteType: GraphQLObjectType<
  NoteDocument,
  Context
> = new GraphQLObjectType<NoteDocument, Context>({
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
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(FlashCardType))),
      description: 'Generated flashcards',
    },
    text: {
      type: GraphQLString,
      description: 'Note text representation',
      resolve: (root, _, ctx) => getNoteIdentifier(root, ctx),
    },
  }),
})

type StudySessionDetailsObject = Map<FlashCardStatus, number>

export const StudySessionDetailsType = new GraphQLObjectType({
  name: 'StudySessionDetails',
  fields: {
    newCount: {
      type: GraphQLNonNull(GraphQLInt),
      resolve: (root: StudySessionDetailsObject) =>
        root.get(FlashCardStatus.NEW) ?? 0,
    },
    learningCount: {
      type: GraphQLNonNull(GraphQLInt),
      resolve: (root: StudySessionDetailsObject) =>
        root.get(FlashCardStatus.LEARNING) ?? 0,
    },
    reviewCount: {
      type: GraphQLNonNull(GraphQLInt),
      resolve: (root: StudySessionDetailsObject) =>
        root.get(FlashCardStatus.REVIEW) ?? 0,
    },
  },
})

const deckNoteConnection = connectionWithCursorInfo({
  nodeType: NoteType,
  connectionFields: {
    totalCount: { type: GraphQLNonNull(GraphQLInt) },
  },
})

export const DeckType = new GraphQLObjectType<DeckDocument, Context>({
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
    published: {
      type: GraphQLNonNull(GraphQLBoolean),
      description: 'Whether this deck is published to the marketplace',
    },
    studySessionDetails: {
      type: GraphQLNonNull(StudySessionDetailsType),
      description: 'Details of current study session',
      resolve: async (root, _, ctx) => {
        const studyFlashCards = await studyFlashCardsByDeck(root._id, ctx)

        const detailsObject: StudySessionDetailsObject = new Map()

        studyFlashCards.forEach((flashCard) => {
          detailsObject.set(
            flashCard.status,
            (detailsObject.get(flashCard.status) ?? 0) + 1
          )
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
        args: PageConnectionArgs & { search?: string },
        ctx: Context
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

        const [notes, totalCount] = await Promise.all([
          notesQuery.skip(paginationStart).limit(args.size).exec(),
          ctx.countNotesByDeckLoader.load(root._id),
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
      resolve: (root, _, ctx) => ctx.countFlashCardsByDeckLoader.load(root._id),
    },
  }),
})
