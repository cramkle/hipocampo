export type Currency = 'BRL' | 'USD'

export type Plan = 'free' | 'premium'

export type PlanPeriod = 'month' | 'year'

export type CardDetails = {
  paymentMethodId: string
  cardLast4: string
  cardBrand: string
  cardExpirationMonth: string
  cardExpirationYear: string
}
