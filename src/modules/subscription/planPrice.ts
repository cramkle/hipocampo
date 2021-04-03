import { stripe } from '../../utils/stripe'
import type { Currency, Plan, PlanPeriod } from './types'

interface PlanPriceArgs {
  plan: Plan
  period: PlanPeriod
  currency: Currency
}

export const getPlanPrice = async ({
  plan,
  period,
  currency,
}: PlanPriceArgs) => {
  if (plan === 'free') {
    return { id: 'free', subscriptionName: 'Free plan', price: 0, currency }
  }

  const {
    data: [premiumSubscriptionProduct],
  } = await stripe.products.list({ limit: 1 })

  if (premiumSubscriptionProduct == null) {
    return null
  }

  const { data: prices } = await stripe.prices.list({
    type: 'recurring',
    product: premiumSubscriptionProduct.id,
    currency,
  })

  if (!prices.length) {
    return null
  }

  const stripePrice =
    prices.find((price) => price.recurring?.interval === period) ?? prices[0]

  return {
    id: stripePrice.id,
    subscriptionName: premiumSubscriptionProduct.name,
    plan,
    price: stripePrice.unit_amount,
    currency: stripePrice.currency,
    interval: stripePrice.recurring!.interval,
  }
}
