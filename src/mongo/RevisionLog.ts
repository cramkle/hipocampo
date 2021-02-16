import type { Document } from 'mongoose'
import { Schema, Types, model } from 'mongoose'

import { FlashcardStatus } from './Note'

export interface RevisionLog {
  interval?: number
  lastInterval?: number
  timespan: number
  easeFactor: number
  status: FlashcardStatus
  nextStatus: FlashcardStatus
  answerQuality: number
  graduationStepsRemaining: number
  nextDueDate?: Date
  ownerId: Types.ObjectId
  noteId: Types.ObjectId
  flashCardId: Types.ObjectId
  deckId: Types.ObjectId
}

export interface RevisionLogDocument extends Document, RevisionLog {}

const RevisionLogSchema = new Schema<RevisionLogDocument>(
  {
    interval: { type: Number },
    lastInterval: { type: Number },
    timespan: { type: Number },
    easeFactor: { type: Number },
    status: { type: FlashcardStatus },
    nextStatus: { type: FlashcardStatus },
    answerQuality: { type: Number },
    graduationStepsRemaining: { type: Number },
    nextDueDate: { type: Schema.Types.Date },
    ownerId: { type: Types.ObjectId, ref: 'User' },
    noteId: { type: Types.ObjectId, ref: 'Note' },
    flashCardId: { type: Types.ObjectId, ref: 'Note.flashCards' },
    deckId: { type: Types.ObjectId, ref: 'Deck', index: true },
    createdAt: { type: Schema.Types.Date },
    updatedAt: { type: Schema.Types.Date },
  },
  {
    timestamps: { createdAt: true },
  }
)

export default model<RevisionLogDocument>('RevisionLog', RevisionLogSchema)
