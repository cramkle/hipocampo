import { Document, Schema, Types, model } from 'mongoose'

import { ContentStateDocument, ContentStateSchema } from './ContentState'

// -----------
// Field values
interface FieldValue {
  data: ContentStateDocument
  fieldId: Types.ObjectId
}

export interface FieldValueDocument extends FieldValue, Document {}

export const FieldValueSchema = new Schema<FieldValueDocument>({
  data: ContentStateSchema,
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
  interval: number
  easeFactor: number
  remainingStepsForGraduation: number
  due: Date
  templateId: Types.ObjectId
  noteId: Types.ObjectId
}

export interface FlashcardDocument extends Document, Flashcard {}

export const FlashcardSchema = new Schema<FlashcardDocument>({
  active: { type: Boolean, default: true },
  status: { type: FlashcardStatus, default: 'NEW' },
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
}

export interface NoteDocument extends Note, Document {}

const NoteSchema = new Schema<NoteDocument>({
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
})

NoteSchema.index({ 'values.data.blocks.text': 'text' })

export default model<NoteDocument>('Note', NoteSchema)
