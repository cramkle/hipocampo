import { isAfter } from 'date-fns'

import type { UserDocument } from '../../mongo/User'
import { stripe } from '../../utils/stripe'
import { SubscriptionModel } from './entities'

export const cancelSubscription = async (user: UserDocument | undefined) => {
  if (!user || user.anonymous) {
    return {
      error: { message: 'Anonymous users cannot cancel a subscription' },
    }
  }

  const userSubscription = await SubscriptionModel.findOne({ userId: user.id })

  if (
    !userSubscription ||
    userSubscription.status !== 'active' ||
    isAfter(userSubscription.subscriptionPeriodEnd, Date.now())
  ) {
    return {
      error: { message: 'User does not have a current active subscription' },
    }
  }

  await stripe.subscriptions.del(userSubscription.stripeSubscriptionId!)

  userSubscription.status = 'inactive'
  userSubscription.stripeSubscriptionId = undefined

  await userSubscription.save()

  return { subscription: userSubscription }
}
