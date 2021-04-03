import type { Document, Types } from 'mongoose'
import { Schema, model } from 'mongoose'
import type { Stripe } from 'stripe'

export type SubscriptionStatus = 'active' | 'inactive' | 'payment_required'

export interface Subscription {
  userId: Types.ObjectId
  plan: string
  period: string
  paymentMethod: string
  cardLast4Digits: string
  cardBrand: string
  cardExpirationMonth: string
  cardExpirationYear: string
  subscriptionPeriodEnd: number
  stripeSubscriptionId?: string
  stripePriceId: string
  stripeProductId: string
  status: SubscriptionStatus
  paymentIntentClientSecret?: string | null
}

export interface SubscriptionDocument extends Subscription, Document {}

const SubscriptionSchema = new Schema<SubscriptionDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    plan: { type: Schema.Types.String, required: true },
    period: { type: Schema.Types.String, required: true },
    paymentMethod: { type: Schema.Types.String, required: true },
    cardLast4Digits: { type: Schema.Types.String, required: true },
    cardBrand: { type: Schema.Types.String, required: true },
    cardExpirationMonth: { type: Schema.Types.String, required: true },
    cardExpirationYear: { type: Schema.Types.String, required: true },
    subscriptionPeriodEnd: { type: Schema.Types.Number, required: true },
    stripeSubscriptionId: { type: Schema.Types.String },
    stripePriceId: { type: Schema.Types.String, required: true },
    stripeProductId: { type: Schema.Types.String, required: true },
    status: { type: Schema.Types.String, required: true },
    paymentIntentClientSecret: { type: Schema.Types.String },
  },
  { timestamps: { createdAt: true, updatedAt: true } }
)

SubscriptionSchema.index('userId', { unique: true })

export const SubscriptionModel = model<SubscriptionDocument>(
  'Subscription',
  SubscriptionSchema
)

export interface Invoice {
  userId: Types.ObjectId
  stripeInvoice: Stripe.Invoice
}

export interface InvoiceDocument extends Invoice, Document {}

const InvoiceSchema = new Schema<InvoiceDocument>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  stripeInvoice: {
    type: Schema.Types.Mixed,
  },
})

InvoiceSchema.index('userId')
InvoiceSchema.index('stripeInvoice.id', { unique: true })

export const InvoiceModel = model<InvoiceDocument>('Invoice', InvoiceSchema)
