import type { Document, Types } from 'mongoose'
import { Schema, model as mongooseModel } from 'mongoose'

export interface Model {
  name: string
  ownerId: Types.ObjectId
  primaryFieldId?: Types.ObjectId
}

export interface ModelDocument extends Model, Document {}

const ModelSchema = new Schema<ModelDocument>(
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
  { timestamps: { createdAt: true, updatedAt: true } }
)

export default mongooseModel<ModelDocument>('Model', ModelSchema)
