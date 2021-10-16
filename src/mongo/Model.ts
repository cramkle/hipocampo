import type { Document, Types } from 'mongoose'
import { Schema, model as mongooseModel } from 'mongoose'

import type { SchemaMethods } from '../utils/createSchema'
import { createSchema } from '../utils/createSchema'

export interface Model {
  name: string
  ownerId: Types.ObjectId
  primaryFieldId?: Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

export interface ModelDocument extends Model, Document, SchemaMethods {}

const ModelSchema = createSchema<ModelDocument>(
  {
    name: String,
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    primaryFieldId: {
      type: Schema.Types.ObjectId,
      ref: 'Field',
    },
    createdAt: { type: Schema.Types.Date },
    updatedAt: { type: Schema.Types.Date },
  },
  {
    hasWritePermission(user, model) {
      return user?._id?.equals(model.ownerId) ?? false
    },
    timestamps: { createdAt: true, updatedAt: true },
  }
)

export default mongooseModel<ModelDocument>('Model', ModelSchema)
