import DataLoader from 'dataloader'
import type { Types } from 'mongoose'

import { mongoIdCacheKeyFn } from '../../loaders/mongoIdCacheKeyFn'
import { normalizeResults } from '../../loaders/normalizeResults'
import type { SubscriptionDocument } from './entities'
import { SubscriptionModel } from './entities'

export const subscriptionByUserLoader = new DataLoader<
  Types.ObjectId,
  SubscriptionDocument,
  string
>(
  (userIds) => {
    return normalizeResults(
      userIds,
      SubscriptionModel.find({
        userId: { $in: Array.from(userIds) },
      }),
      'userId',
      mongoIdCacheKeyFn
    )
  },
  { cacheKeyFn: mongoIdCacheKeyFn }
)
