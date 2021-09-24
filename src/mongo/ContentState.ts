import type { DraftEntityMutability, RawDraftInlineStyleRange } from 'draft-js'
import type { Document } from 'mongoose'
import { Schema } from 'mongoose'

type BlockData = Record<string, unknown>

export type EntityMapValue =
  | {
      type: 'TAG'
      mutability: DraftEntityMutability
      data: { id: string }
    }
  | { type: 'LINK'; mutability: DraftEntityMutability; data: { url: string } }

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
    [key: string]: EntityMapValue
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
})
