import { Types } from 'mongoose'

export function mongoIdCacheKeyFn(id: Types.ObjectId) {
  return id.toString()
}
