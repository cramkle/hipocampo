import type { Document, Types } from 'mongoose'
import { Schema, model } from 'mongoose'
import shortid from 'shortid'

import type { SchemaMethods } from '../utils/createSchema'
import { createSchema } from '../utils/createSchema'

export interface NewFlashcardConfiguration
  extends LearningFlashcardConfiguration {
  /**
   * How many new flashcards to study per day
   */
  perDay: number
  /**
   * Interval to schedule flashcard after it has
   * graduated naturally from learning to review.
   */
  graduateInterval: number
  /**
   * Interval to schedule flashcard after it has
   * graduated from learning to review through the
   * "easy" button.
   */
  easyInterval: number
  /**
   * Ease factor used when the flashcard graduates
   * to a review flashcard.
   */
  initialEaseFactor: number
}

export interface ReviewFlashcardConfiguration {
  /**
   * How many review flashcards to study per day
   */
  perDay: number
}

export interface LapseFlashcardConfiguration
  extends LearningFlashcardConfiguration {
  /**
   * Minimum interval of a flashcard that has been
   * forgotten
   */
  minimumInterval: number
  /**
   * How much (in %) of the old interval to use in
   * the lapsed card
   */
  intervalPercentage: number
}

export interface LearningFlashcardConfiguration {
  /**
   * Refer to the interval the current flashcard
   * has to go through in order to graduate to the
   * next status (e.g. from learning to review, or
   * lapsed to review). The unit of the specified
   * elements in the array are in minutes.
   *
   * For example, take the following array: [1, 10]. This
   * means that when the flashcard is answered with "good"
   * it will be seen in 1 minute from now, and then if it
   * is answered "good" again, will be seen in 10 minutes,
   * which will then be graduated to a review flashcard and
   * the SM2 algorithm will be used instead.
   */
  steps: number[]
}

export interface DeckConfiguration {
  /**
   * Configuration for new and learning flashcards
   */
  new: NewFlashcardConfiguration
  /**
   * Configuration for flashcards that are in review
   */
  review: ReviewFlashcardConfiguration
  /**
   * Configuration for flashcards that have been forgotten
   */
  lapse: LapseFlashcardConfiguration
}

export interface DeckConfigurationDocument
  extends DeckConfiguration,
    Document {}

export interface Deck {
  title: string
  description?: string
  slug: string
  published: boolean
  configuration: DeckConfiguration
  ownerId: Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

export interface DeckDocument extends Deck, Document, SchemaMethods {}

const DeckConfigurationSchema = new Schema<DeckConfigurationDocument>({
  new: {
    perDay: { type: Number },
    steps: [{ type: Number }],
    graduateInterval: {
      type: Number,
    },
    easyInterval: {
      type: Number,
    },
    initialEaseFactor: { type: Number },
  },
  review: {
    perDay: { type: Number },
  },
  lapse: {
    steps: [{ type: Number }],
    minimumInterval: { type: Number },
    intervalPercentage: { type: Number },
  },
})

export const defaultDeckConfig: DeckConfiguration = {
  new: {
    perDay: 20,
    steps: [1, 10],
    graduateInterval: 1,
    easyInterval: 4,
    initialEaseFactor: 2.5,
  },
  review: {
    perDay: 100,
  },
  lapse: {
    steps: [10],
    minimumInterval: 1,
    intervalPercentage: 0,
  },
}

const DeckSchema = createSchema<DeckDocument>(
  {
    title: {
      type: String,
      required: true,
    },
    description: String,
    slug: {
      type: String,
      unique: true,
      index: true,
    },
    configuration: {
      type: DeckConfigurationSchema,
      default: defaultDeckConfig,
    },
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    published: Boolean,
    createdAt: {
      type: Schema.Types.Date,
    },
    updatedAt: { type: Schema.Types.Date },
  },
  {
    hasWritePermission(user, deck) {
      return user?._id?.equals(deck.ownerId) ?? false
    },
    timestamps: { createdAt: true, updatedAt: true },
  }
)

DeckSchema.pre('save', function (next) {
  const deck = this as DeckDocument

  if (!deck.isNew) {
    return next()
  }

  deck.slug = shortid.generate()

  next()
})

export default model<DeckDocument>('Deck', DeckSchema)
