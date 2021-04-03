import type { Types } from 'mongoose'

export function mongoIdCacheKeyFn(id: Types.ObjectId | string) {
  return id.toString()
}
