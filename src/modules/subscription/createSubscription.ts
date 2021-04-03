import { isBefore } from 'date-fns'
import type { Stripe } from 'stripe'

import type { UserDocument } from '../../mongo/User'
import { stripe } from '../../utils/stripe'
import { InvoiceModel, SubscriptionModel } from './entities'
import type { CardDetails } from './types'

export type CreateSubscriptionArgs = {
  priceId: string
  cardDetails?: CardDetails
}

export const createSubscription = async (
  user: UserDocument | undefined,
  { cardDetails, priceId }: CreateSubscriptionArgs
) => {
  if (!user || user.anonymous) {
    return {
      error: {
        message: 'Anonymous users cannot start a subscription',
        status: 400,
      },
    }
  }

  if (!user.stripeCustomerId) {
    const stripeCustomer = await stripe.customers.create({
      name: user.username,
      email: user.email,
      preferred_locales: [user.preferences?.locale ?? 'en'],
    })

    // eslint-disable-next-line require-atomic-updates
    user.stripeCustomerId = stripeCustomer.id

    await user.save()
  }

  if (cardDetails != null) {
    try {
      await stripe.paymentMethods.attach(cardDetails.paymentMethodId, {
        customer: user.stripeCustomerId,
      })
    } catch (error) {
      return { error: { message: error.message, status: 402 } }
    }

    await stripe.customers.update(user.stripeCustomerId, {
      invoice_settings: {
        default_payment_method: cardDetails.paymentMethodId,
      },
    })
  }

  const userSubscription = await SubscriptionModel.findOne({ userId: user.id })

  if (userSubscription != null) {
    if (
      userSubscription.status === 'active' ||
      (userSubscription.status === 'inactive' &&
        isBefore(userSubscription.subscriptionPeriodEnd, Date.now()))
    ) {
      return {
        error: {
          message: 'User already have an active subscription',
          status: 400,
        },
      }
    }

    const stripeSubscription = await stripe.subscriptions.retrieve(
      userSubscription.stripeSubscriptionId!,
      {
        expand: ['latest_invoice.payment_intent', 'items.data.price.product'],
      }
    )

    const item = stripeSubscription.items.data[0]

    const invoice = stripeSubscription.latest_invoice as Stripe.Invoice
    let paymentIntent = invoice.payment_intent as Stripe.PaymentIntent

    console.log(paymentIntent)

    if (paymentIntent.status === 'requires_payment_method' && cardDetails) {
      paymentIntent = await stripe.paymentIntents.update(paymentIntent.id, {
        payment_method: cardDetails.paymentMethodId,
      })
    }

    const updatedSubscription = await SubscriptionModel.findByIdAndUpdate(
      userSubscription.id,
      {
        $set: {
          plan: (item.price.product as Stripe.Product).name,
          period: item.price.recurring!.interval,
          subscriptionPeriodEnd: stripeSubscription.current_period_end,
          status:
            paymentIntent.status === 'succeeded'
              ? 'active'
              : 'payment_required',
          paymentIntentClientSecret:
            paymentIntent.status === 'requires_action' ||
            paymentIntent.status === 'requires_confirmation'
              ? paymentIntent.client_secret
              : undefined,
        },
      },
      {
        new: true,
      }
    )

    return { subscription: updatedSubscription }
  }

  if (cardDetails == null) {
    return {
      error: {
        message: 'Credit card is required for first purchase',
        status: 400,
      },
    }
  }

  const stripeSubscription = await stripe.subscriptions.create({
    customer: user.stripeCustomerId,
    items: [{ price: priceId }],
    expand: [
      'latest_invoice.payment_intent',
      'latest_invoice.payment_intent.payment_method',
      'items.data.price.product',
    ],
  })

  const item = stripeSubscription.items.data[0]

  const invoice = stripeSubscription.latest_invoice as Stripe.Invoice
  const paymentIntent = invoice.payment_intent as Stripe.PaymentIntent

  const subscription = await SubscriptionModel.create({
    userId: user.id,
    plan: (item.price.product as Stripe.Product).name,
    period: item.price.recurring!.interval,
    paymentMethod: cardDetails.paymentMethodId,
    cardLast4Digits: cardDetails.cardLast4,
    cardExpirationMonth: cardDetails.cardExpirationMonth,
    cardExpirationYear: cardDetails.cardExpirationYear,
    cardBrand: cardDetails.cardBrand,
    subscriptionPeriodEnd: stripeSubscription.current_period_end,
    stripeSubscriptionId: stripeSubscription.id,
    stripePriceId: priceId,
    stripeProductId: (item.price.product as Stripe.Product).id,
    status:
      stripeSubscription.status === 'active' ? 'active' : 'payment_required',
    paymentIntentClientSecret:
      paymentIntent.status === 'requires_action' ||
      paymentIntent.status === 'requires_confirmation'
        ? paymentIntent.client_secret
        : undefined,
  })

  if (invoice.status === 'paid') {
    await InvoiceModel.create({
      userId: user.id,
      stripeInvoice: invoice,
    })
  }

  return { subscription }
}
