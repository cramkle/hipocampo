import { Document, Schema, Types, model } from 'mongoose'

import { ContentState, ContentStateSchema } from './ContentState'

export interface Template {
  name: string
  frontSide: ContentState | null
  backSide: ContentState | null
  modelId: Types.ObjectId
  ownerId: Types.ObjectId
}

export interface TemplateDocument extends Template, Document {}

const TemplateSchema = new Schema<TemplateDocument>({
  name: String,
  frontSide: ContentStateSchema,
  backSide: ContentStateSchema,
  modelId: {
    type: Schema.Types.ObjectId,
    ref: 'Model',
    index: true,
  },
  ownerId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
})

export default model<TemplateDocument>('Template', TemplateSchema)
