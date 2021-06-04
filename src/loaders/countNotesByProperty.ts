import type { Types } from 'mongoose'

import { NoteModel } from '../mongo'
import type { NoteDocument } from '../mongo/Note'
import { mongoIdCacheKeyFn } from './mongoIdCacheKeyFn'
import { normalizeResults } from './normalizeResults'

export const countNotesByProperty =
  (propertyName: keyof NoteDocument) =>
  async (keys: readonly Types.ObjectId[]) => {
    const noteCounts = await NoteModel.aggregate<{
      _id: Types.ObjectId
      totalNotes: number
    }>([
      {
        $match: {
          [propertyName]: { $in: Array.from(keys) },
        },
      },
      {
        $group: {
          _id: `$${propertyName}`,
          totalNotes: { $sum: 1 },
        },
      },
    ])

    const normalizedResults = await normalizeResults(
      keys,
      noteCounts,
      '_id',
      mongoIdCacheKeyFn
    )

    return normalizedResults.map((value) =>
      'totalNotes' in value ? value.totalNotes : 0
    )
  }
