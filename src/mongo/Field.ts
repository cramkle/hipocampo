import type { Document, Types } from 'mongoose'
import { Schema, model } from 'mongoose'

import { ModelModel } from '.'
import type { SchemaMethods } from '../utils/createSchema'
import { createSchema } from '../utils/createSchema'

export interface Field {
  name: string
  modelId: Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

export interface FieldDocument extends Field, Document, SchemaMethods {}

const FieldSchema = createSchema<FieldDocument>(
  {
    name: { type: String, required: true },
    modelId: {
      type: Schema.Types.ObjectId,
      ref: 'Model',
      index: true,
    },
    createdAt: {
      type: Schema.Types.Date,
    },
    updatedAt: {
      type: Schema.Types.Date,
    },
  },
  {
    async hasWritePermission(user, field) {
      if (!user?._id) {
        return false
      }

      const model = await ModelModel.findById(field.modelId)

      if (!model) {
        return false
      }

      return user._id.equals(model.ownerId)
    },
    timestamps: { createdAt: true, updatedAt: true },
  }
)

export default model<FieldDocument>('Field', FieldSchema)
