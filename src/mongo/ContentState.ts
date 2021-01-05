import { DraftEntityMutability, RawDraftInlineStyleRange } from 'draft-js'
import { Document, Schema } from 'mongoose'

type BlockData = Record<string, unknown>

export interface ContentState {
  blocks: {
    key: string
    type: string
    text: string
    depth: number
    inlineStyleRanges: RawDraftInlineStyleRange[]
    entityRanges: {
      key: number
      length: number
      offset: number
    }[]
    data: BlockData
  }[]
  entityMap: {
    [key: string]: {
      type: string
      mutability: DraftEntityMutability
      data: BlockData
    }
  }
}

export interface ContentStateDocument extends ContentState, Document {}

export const ContentStateSchema = new Schema<ContentStateDocument>({
  blocks: [
    {
      key: String,
      type: { type: String },
      text: String,
      inlineStyleRanges: [
        {
          style: String,
          offset: Number,
          length: Number,
        },
      ],
      entityRanges: [
        {
          key: Number,
          length: Number,
          offset: Number,
        },
      ],
      depth: Number,
      data: Object,
    },
  ],
  entityMap: Object,
  ownerId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
})
