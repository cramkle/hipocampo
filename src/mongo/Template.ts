import type { Document, Types } from 'mongoose'
import { Schema, model } from 'mongoose'

import type { SchemaMethods } from '../utils/createSchema'
import { createSchema } from '../utils/createSchema'
import type { ContentState } from './ContentState'
import { ContentStateSchema } from './ContentState'

export interface Template {
  name: string
  frontSide: ContentState | null
  backSide: ContentState | null
  modelId: Types.ObjectId
  ownerId: Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

export interface TemplateDocument extends Template, Document, SchemaMethods {}

const TemplateSchema = createSchema<TemplateDocument>(
  {
    name: String,
    frontSide: { type: ContentStateSchema },
    backSide: { type: ContentStateSchema },
    modelId: {
      type: Schema.Types.ObjectId,
      ref: 'Model',
      index: true,
    },
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    createdAt: { type: Schema.Types.Date },
    updatedAt: { type: Schema.Types.Date },
  },
  {
    hasWritePermission(user, template) {
      return user?._id?.equals(template.ownerId) ?? false
    },
    timestamps: { createdAt: true, updatedAt: true },
  }
)

export default model<TemplateDocument>('Template', TemplateSchema)
