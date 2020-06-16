import { Types } from 'mongoose'

import { NoteModel } from '../mongo'
import { NoteDocument } from '../mongo/Note'
import { mongoIdCacheKeyFn } from './mongoIdCacheKeyFn'
import { normalizeResults } from './normalizeResults'

export const countFlashCardsByProperty = (
  propertyName: keyof NoteDocument
) => async (keys: readonly Types.ObjectId[]) => {
  const flashCardCounts = await NoteModel.aggregate<{
    _id: Types.ObjectId
    totalFlashCards: number
  }>([
    {
      $match: {
        [propertyName]: { $in: Array.from(keys) },
      },
    },
    {
      $unwind: '$flashCards',
    },
    {
      $group: {
        _id: `$${propertyName}`,
        flashCards: { $push: '$flashCards' },
      },
    },
    {
      $project: {
        totalFlashCards: { $size: '$flashCards' },
      },
    },
  ])

  const normalizedResults = await normalizeResults(
    keys,
    flashCardCounts,
    '_id',
    mongoIdCacheKeyFn
  )

  return normalizedResults.map((value) =>
    'totalFlashCards' in value ? value.totalFlashCards : 0
  )
}
