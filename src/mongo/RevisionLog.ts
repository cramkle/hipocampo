import type { Document, Types } from 'mongoose'
import { Schema, model } from 'mongoose'

import type { SchemaMethods } from '../utils/createSchema'
import { createSchema } from '../utils/createSchema'
import type { FlashcardStatus } from './Note'

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
  createdAt: Date
  updatedAt: Date
}

export interface RevisionLogDocument
  extends Document,
    RevisionLog,
    SchemaMethods {}

const RevisionLogSchema = createSchema<RevisionLogDocument>(
  {
    interval: { type: Number },
    lastInterval: { type: Number },
    timespan: { type: Number },
    easeFactor: { type: Number },
    status: { type: String },
    nextStatus: { type: String },
    answerQuality: { type: Number },
    graduationStepsRemaining: { type: Number },
    nextDueDate: { type: Schema.Types.Date },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User' },
    noteId: { type: Schema.Types.ObjectId, ref: 'Note' },
    flashCardId: { type: Schema.Types.ObjectId, ref: 'Note.flashCards' },
    deckId: { type: Schema.Types.ObjectId, ref: 'Deck', index: true },
    createdAt: { type: Schema.Types.Date },
    updatedAt: { type: Schema.Types.Date },
  },
  {
    hasWritePermission(user, revisionLog) {
      return user?._id?.equals(revisionLog.ownerId) ?? false
    },
    timestamps: { createdAt: true },
  }
)

export default model<RevisionLogDocument>('RevisionLog', RevisionLogSchema)
