import type { Document, Types } from 'mongoose'
import { Schema, model } from 'mongoose'

import type { SchemaMethods } from '../utils/createSchema'
import { createSchema } from '../utils/createSchema'
import type { ContentStateDocument } from './ContentState'
import { ContentStateSchema } from './ContentState'

// -----------
// Field values
interface FieldValue {
  data?: ContentStateDocument
  fieldId: Types.ObjectId
}

export interface FieldValueDocument extends FieldValue, Document {}

export const FieldValueSchema = new Schema<FieldValueDocument>({
  data: { type: ContentStateSchema },
  fieldId: {
    type: Schema.Types.ObjectId,
    ref: 'Field',
  },
})

// ----------
// Flashcards
export enum FlashcardStatus {
  NEW = 'NEW',
  LEARNING = 'LEARNING',
  REVIEW = 'REVIEW',
  RELEARNING = 'RELEARNING',
}

export interface Flashcard {
  active: boolean
  /**
   * @deprecated Use `status` instead
   */
  state: FlashcardStatus
  status: FlashcardStatus
  lapses: number
  reviews: number
  interval?: number
  easeFactor: number
  remainingStepsForGraduation: number
  due?: Date
  templateId: Types.ObjectId
  noteId: Types.ObjectId
}

export interface FlashcardDocument extends Document, Flashcard {}

export const FlashcardSchema = new Schema<FlashcardDocument>({
  active: { type: Boolean, default: true },
  status: { type: String, default: FlashcardStatus.NEW },
  lapses: { type: Number, default: 0 },
  reviews: { type: Number, default: 0 },
  interval: { type: Number },
  easeFactor: { type: Number, default: 2.5 },
  remainingStepsForGraduation: { type: Number },
  due: { type: Schema.Types.Date },
  templateId: {
    type: Schema.Types.ObjectId,
    ref: 'Template',
  },
  noteId: {
    type: Schema.Types.ObjectId,
    ref: 'Note',
  },
})

// ----------
// Note
export interface Note {
  flashCards: Types.DocumentArray<FlashcardDocument>
  values: Types.DocumentArray<FieldValueDocument>
  deckId: Types.ObjectId
  modelId: Types.ObjectId
  ownerId: Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

export interface NoteDocument extends Note, Document, SchemaMethods {}

const NoteSchema = createSchema<NoteDocument>(
  {
    deckId: {
      type: Schema.Types.ObjectId,
      index: true,
      ref: 'Deck',
    },
    modelId: {
      type: Schema.Types.ObjectId,
      ref: 'Model',
    },
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    values: [FieldValueSchema],
    flashCards: [FlashcardSchema],
    createdAt: {
      type: Schema.Types.Date,
    },
    updatedAt: {
      type: Schema.Types.Date,
    },
  },
  {
    hasWritePermission(user, note) {
      return user?._id?.equals(note.ownerId) ?? false
    },
    timestamps: { createdAt: true, updatedAt: true },
  }
)

NoteSchema.index({ 'values.data.blocks.text': 'text' })

export default model<NoteDocument>('Note', NoteSchema)
