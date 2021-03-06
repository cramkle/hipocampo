import {
  GraphQLBoolean,
  GraphQLEnumType,
  GraphQLFloat,
  GraphQLInt,
  GraphQLNonNull,
  GraphQLObjectType,
} from 'graphql'

import type { FlashcardDocument } from '../../mongo/Note'
import { FlashcardStatus } from '../../mongo/Note'
import { graphQLGlobalIdField } from '../../utils/graphqlID'
import { NoteType } from '../deck/types'
import { nodeInterface } from '../node/types'
import { TemplateType } from '../template/types'

export const FlashcardStatusEnumType = new GraphQLEnumType({
  name: 'FlashCardStatus',
  values: {
    NEW: {},
    LEARNING: {},
    REVIEW: {},
  },
})

export const FlashcardType: GraphQLObjectType<FlashcardDocument, Context> =
  new GraphQLObjectType<FlashcardDocument, Context>({
    name: 'FlashCard',
    description: `
Flashcards are what the user study/reviews in the study sessions.

The objects of this type are auto generated when creating
the note and depend of the number of templates that are
associated with the model.

The number of flashcards on each note is always equal to the
number of templates.
  `.trim(),
    interfaces: [nodeInterface],
    fields: () => ({
      id: graphQLGlobalIdField(),
      note: {
        type: NoteType,
        description: 'Parent note of the flashcard.',
        resolve: (root, _, ctx) => ctx.noteLoader.load(root.noteId),
      },
      template: {
        type: TemplateType,
        description: 'Template associated with this flashcard.',
        resolve: (root, _, ctx) => ctx.templateLoader.load(root.templateId),
      },
      status: {
        type: FlashcardStatusEnumType,
        description: 'Current status of this flashcard.',
        resolve: (root) => {
          const status = root.status ?? root.state

          if (status === FlashcardStatus.RELEARNING) {
            return FlashcardStatus.LEARNING
          }

          return status
        },
      },
      due: {
        type: GraphQLFloat,
        description: 'Due date of this flashcard, in a timestamp format.',
        resolve: (root) => root.due?.getTime(),
      },
      active: {
        type: GraphQLNonNull(GraphQLBoolean),
        description: `
Whether to be filtered of not.

Acts like a logical deletion it when comes to the review.
      `.trim(),
      },
      lapses: {
        type: GraphQLNonNull(GraphQLInt),
        description:
          'Number of times the user has forgotten the answer to this flashcard.',
      },
      reviews: {
        type: GraphQLNonNull(GraphQLInt),
        description: 'Number of times the user has reviewed this flashcard.',
      },
      interval: {
        type: GraphQLNonNull(GraphQLInt),
        description:
          'Base interval number used for calculating the next due date.',
      },
      easeFactor: {
        type: GraphQLNonNull(GraphQLFloat),
        description:
          'Ease factor used for calculating the interval when the user correctly answers the flashcard.',
      },
    }),
  })
