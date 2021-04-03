import type { UserDocument } from '../../mongo/User'
import { stripe } from '../../utils/stripe'
import { SubscriptionModel } from './entities'
import type { CardDetails } from './types'

export interface UpdatePaymentMethodArgs {
  cardDetails: CardDetails
}

export const updatePaymentMethod = async (
  user: UserDocument | undefined,
  { cardDetails }: UpdatePaymentMethodArgs
) => {
  if (!user || user.anonymous) {
    return {
      error: {
        message: 'Anonymous users cannot update payment method',
        status: 400,
      },
    }
  }

  const userSubscription = await SubscriptionModel.findOne({ userId: user.id })

  if (!user.stripeCustomerId || !userSubscription) {
    return {
      error: {
        message: 'User does not have an active subscription',
        status: 400,
      },
    }
  }

  try {
    await stripe.paymentMethods.attach(cardDetails.paymentMethodId, {
      customer: user.stripeCustomerId,
    })

    await stripe.customers.update(user.stripeCustomerId, {
      invoice_settings: {
        default_payment_method: cardDetails.paymentMethodId,
      },
    })
  } catch (error) {
    return { error: { message: error.message, status: 402 } }
  }

  const updatedSubscription = await SubscriptionModel.findByIdAndUpdate(
    userSubscription.id,
    {
      $set: {
        paymentMethod: cardDetails.paymentMethodId,
        cardLast4Digits: cardDetails.cardLast4,
        cardExpirationMonth: cardDetails.cardExpirationMonth,
        cardExpirationYear: cardDetails.cardExpirationYear,
        cardBrand: cardDetails.cardBrand,
      },
    }
  )

  return { subscription: updatedSubscription }
}
