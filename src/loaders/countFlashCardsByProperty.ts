import { Types } from 'mongoose'

import { NoteModel } from '../mongo'
import { NoteDocument } from '../mongo/Note'
import { mongoIdCacheKeyFn } from './mongoIdCacheKeyFn'
import { normalizeResults } from './normalizeResults'

export const countFlashcardsByProperty = (
  propertyName: keyof NoteDocument
) => async (keys: readonly Types.ObjectId[]) => {
  const flashcardCounts = await NoteModel.aggregate<{
    _id: Types.ObjectId
    totalFlashcards: number
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
        flashcards: { $push: '$flashCards' },
      },
    },
    {
      $project: {
        totalFlashcards: { $size: '$flashcards' },
      },
    },
  ])

  const normalizedResults = await normalizeResults(
    keys,
    flashcardCounts,
    '_id',
    mongoIdCacheKeyFn
  )

  return normalizedResults.map((value) =>
    'totalFlashcards' in value ? value.totalFlashcards : 0
  )
}
