import { stripe } from '../../utils/stripe'

export interface SubscriptionPricesArgs {
  plan: string
  currency: string
}

export const getSubscriptionPrices = async ({
  plan,
  currency,
}: SubscriptionPricesArgs) => {
  if (plan === 'free') {
    return {
      id: 'free',
      subscriptionName: 'Basic',
      plan,
      prices: [],
    }
  }

  const { data: stripeProducts } = await stripe.products.list({
    type: 'service',
  })

  const subscriptionPlan = stripeProducts.find(
    (product) => product.metadata['cramkle_subscription'] === plan
  )

  if (!subscriptionPlan) {
    return null
  }

  const { data: prices } = await stripe.prices.list({
    type: 'recurring',
    product: subscriptionPlan.id,
    currency: currency.toLowerCase(),
  })

  return {
    id: subscriptionPlan.id,
    subscriptionName: subscriptionPlan.name,
    plan,
    prices,
  }
}
