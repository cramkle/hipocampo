import { GraphQLID, GraphQLInt, GraphQLNonNull } from 'graphql'
import { fromGlobalId, mutationWithClientMutationId } from 'graphql-relay'

import type { FlashcardAnswer } from '../../modules/scheduler'
import {
  answerToQualityValue,
  scheduleFlashcard,
} from '../../modules/scheduler'
import { NoteModel, RevisionLogModel } from '../../mongo'
import { FlashcardType } from '../flashcard/types'
import { FlashcardAnswerEnumType } from './types'

interface AnswerFlashCardArgs {
  noteId: string
  flashCardId: string
  flashcardId: string
  answer: FlashcardAnswer
  timespan: number
}

export const answerFlashcard = mutationWithClientMutationId({
  name: 'AnswerFlashcard',
  description:
    'Records an answer to the flashcard during the study session and re-schedules it to a future date.',
  inputFields: {
    noteId: { type: GraphQLID, description: 'Id of the flashcard note' },
    flashCardId: {
      type: GraphQLID,
      description: '(Deprecated) ID of the flashcard',
    },
    flashcardId: {
      type: GraphQLID,
      description: 'Id of the flashcard',
    },
    answer: { type: FlashcardAnswerEnumType, description: 'Answer value' },
    timespan: {
      type: GraphQLInt,
      description: 'Time the user took to answer in milliseconds',
    },
  },
  outputFields: {
    flashCard: {
      type: GraphQLNonNull(FlashcardType),
      deprecationReason: "Use field 'flashcard' instead.",
    },
    flashcard: { type: GraphQLNonNull(FlashcardType) },
  },
  mutateAndGetPayload: async (args: AnswerFlashCardArgs, ctx: Context) => {
    const { id: noteId } = fromGlobalId(args.noteId)
    const { id: flashCardId } = fromGlobalId(
      args.flashCardId ?? args.flashcardId
    )

    const note = await NoteModel.findOne({
      _id: noteId,
      ownerId: ctx.user!._id,
    })

    const flashcard = note?.flashCards.id(flashCardId)

    if (!note || !flashcard) {
      throw new Error('Flashcard not found')
    }

    const deck = await ctx.deckLoader.load(note.deckId)

    // limits the answer timespan to 60 seconds to avoid
    // poluting the statistics when the user gets distracted
    // while studying.
    const timespan = Math.min(args.timespan, 60 * 1000)

    const lastInterval = flashcard.interval
    const status = flashcard.status

    scheduleFlashcard({
      flashcard,
      answer: args.answer,
      deckConfig: deck.configuration,
      user: ctx.user!,
    })

    await NoteModel.updateOne(
      { '_id': note._id, 'flashCards._id': flashcard._id },
      { $set: { 'flashCards.$': flashcard } }
    )

    await RevisionLogModel.create({
      interval: flashcard.interval,
      lastInterval,
      status,
      nextStatus: flashcard.status,
      answerQuality: answerToQualityValue(args.answer),
      easeFactor: flashcard.easeFactor,
      timespan,
      graduationStepsRemaining: flashcard.remainingStepsForGraduation,
      nextDueDate: flashcard.due,
      ownerId: ctx.user!._id,
      noteId: note._id,
      flashCardId: flashcard._id,
      deckId: note.deckId,
    })

    return { flashCard: flashcard, flashcard }
  },
})
