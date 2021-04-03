import { isBefore } from 'date-fns'
import {
  GraphQLBoolean,
  GraphQLID,
  GraphQLInputObjectType,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from 'graphql'
import { mutationWithClientMutationId } from 'graphql-relay'
import type { Stripe } from 'stripe'

import { nodeInterface } from '../../resolvers/node/types'
import { graphQLGlobalIdField } from '../../utils/graphqlID'
import { cancelSubscription } from './cancelSubscription'
import type { CreateSubscriptionArgs } from './createSubscription'
import { createSubscription } from './createSubscription'
import type { InvoiceDocument, SubscriptionDocument } from './entities'
import type { SubscriptionPricesArgs } from './subscriptionPrices'
import { getSubscriptionPrices } from './subscriptionPrices'
import type { UpdatePaymentMethodArgs } from './updatePaymentMethod'
import { updatePaymentMethod } from './updatePaymentMethod'

const SubscriptionPrice = new GraphQLObjectType<Stripe.Price>({
  name: 'SubscriptionPrice',
  fields: {
    id: {
      type: GraphQLNonNull(GraphQLID),
    },
    period: {
      type: GraphQLNonNull(GraphQLString),
      resolve(price) {
        return price.recurring!.interval
      },
    },
    amount: {
      type: GraphQLNonNull(GraphQLInt),
      resolve(price) {
        return price.unit_amount
      },
    },
    currency: { type: GraphQLNonNull(GraphQLString) },
  },
})

const SubscriptionPlan = new GraphQLObjectType({
  name: 'SubscriptionPlan',
  fields: {
    id: { type: GraphQLNonNull(GraphQLID) },
    subscriptionName: { type: GraphQLNonNull(GraphQLString) },
    plan: { type: GraphQLNonNull(GraphQLString) },
    prices: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(SubscriptionPrice))),
    },
  },
})

export const SubscriptionType = new GraphQLObjectType<
  SubscriptionDocument,
  Context
>({
  name: 'Subscription',
  fields: {
    active: {
      type: GraphQLNonNull(GraphQLBoolean),
      resolve: (subscription) =>
        subscription.status === 'active' ||
        (subscription.status === 'inactive' &&
          isBefore(subscription.subscriptionPeriodEnd, Date.now())),
    },
    status: {
      type: GraphQLNonNull(GraphQLString),
    },
    paymentIntentClientSecret: {
      type: GraphQLString,
    },
    plan: {
      type: GraphQLNonNull(GraphQLString),
    },
    period: {
      type: GraphQLNonNull(GraphQLString),
    },
    planPriceId: {
      type: GraphQLNonNull(GraphQLID),
      resolve(subscription) {
        return subscription.stripePriceId
      },
    },
    endsAt: {
      type: GraphQLNonNull(GraphQLString),
      resolve: (subscription) =>
        new Date(subscription.subscriptionPeriodEnd * 1000).toISOString(),
    },
    paymentMethodId: {
      type: GraphQLNonNull(GraphQLID),
      resolve(subscription) {
        return subscription.paymentMethod
      },
    },
    cardBrand: {
      type: GraphQLNonNull(GraphQLString),
    },
    cardLast4Digits: {
      type: GraphQLNonNull(GraphQLString),
    },
    cardExpirationMonth: {
      type: GraphQLNonNull(GraphQLString),
    },
    cardExpirationYear: {
      type: GraphQLNonNull(GraphQLString),
    },
  },
})

export const InvoiceType = new GraphQLObjectType<InvoiceDocument, Context>({
  name: 'Invoice',
  interfaces: [nodeInterface],
  fields: {
    id: graphQLGlobalIdField(),
    description: {
      type: GraphQLString,
      resolve(invoice) {
        return invoice.stripeInvoice.description
      },
    },
    number: {
      type: GraphQLString,
      resolve(invoice) {
        return invoice.stripeInvoice.number
      },
    },
    currency: {
      type: GraphQLNonNull(GraphQLString),
      resolve(invoice) {
        return invoice.stripeInvoice.currency
      },
    },
    subTotal: {
      type: GraphQLNonNull(GraphQLInt),
      resolve(invoice) {
        return invoice.stripeInvoice.subtotal
      },
    },
    total: {
      type: GraphQLNonNull(GraphQLInt),
      resolve(invoice) {
        return invoice.stripeInvoice.total
      },
    },
    hostedUrl: {
      type: GraphQLString,
      resolve(invoice) {
        return invoice.stripeInvoice.hosted_invoice_url
      },
    },
    periodEnd: {
      type: GraphQLNonNull(GraphQLString),
      resolve(invoice) {
        return new Date(invoice.stripeInvoice.period_end * 1000).toISOString()
      },
    },
    cardBrand: {
      type: GraphQLNonNull(GraphQLString),
      resolve(invoice) {
        return ((invoice.stripeInvoice.payment_intent as Stripe.PaymentIntent)
          .payment_method as Stripe.PaymentMethod).card!.brand
      },
    },
    cardLast4Digits: {
      type: GraphQLNonNull(GraphQLString),
      resolve(invoice) {
        return ((invoice.stripeInvoice.payment_intent as Stripe.PaymentIntent)
          .payment_method as Stripe.PaymentMethod).card!.last4
      },
    },
  },
})

const CreateSubscriptionErrorType = new GraphQLObjectType({
  name: 'CreateSubscriptionError',
  fields: {
    message: { type: GraphQLNonNull(GraphQLString) },
    status: { type: GraphQLNonNull(GraphQLInt) },
  },
})

const CancelSubscriptionErrorType = new GraphQLObjectType({
  name: 'CancelSubscriptionError',
  fields: {
    message: { type: GraphQLNonNull(GraphQLString) },
  },
})

const UpdatePaymentMethodErrorType = new GraphQLObjectType({
  name: 'UpdatePaymentMethodError',
  fields: {
    message: { type: GraphQLNonNull(GraphQLString) },
    status: { type: GraphQLNonNull(GraphQLInt) },
  },
})

export const queries = {
  subscriptionPlan: {
    type: SubscriptionPlan,
    description: 'Get a subscription plan details and prices',
    args: {
      currency: {
        type: GraphQLNonNull(GraphQLString),
        defaultValue: 'USD',
      },
      plan: {
        type: GraphQLNonNull(GraphQLString),
        defaultValue: 'free',
      },
    },
    resolve: (async (
      _: unknown,
      { currency, plan }: SubscriptionPricesArgs
    ) => {
      const subscription = await getSubscriptionPrices({ currency, plan })

      return subscription
    }) as any,
  },
}

const CardDetailsInput = new GraphQLInputObjectType({
  name: 'CardDetails',
  fields: {
    paymentMethodId: { type: GraphQLNonNull(GraphQLID) },
    cardLast4: { type: GraphQLNonNull(GraphQLString) },
    cardBrand: { type: GraphQLNonNull(GraphQLString) },
    cardExpirationMonth: { type: GraphQLNonNull(GraphQLString) },
    cardExpirationYear: { type: GraphQLNonNull(GraphQLString) },
  },
})

export const mutations = {
  createSubscription: mutationWithClientMutationId({
    name: 'CreateSubscription',
    inputFields: {
      priceId: { type: GraphQLNonNull(GraphQLID) },
      cardDetails: { type: CardDetailsInput },
    },
    outputFields: {
      subscription: { type: SubscriptionType },
      error: {
        type: CreateSubscriptionErrorType,
      },
    },
    async mutateAndGetPayload(
      args: CreateSubscriptionArgs,
      { user, subscriptionByUserLoader }: Context
    ) {
      const result = await createSubscription(user, args)

      if (user) {
        subscriptionByUserLoader.clear(user.id)
      }

      return result
    },
  }),
  cancelSubscription: mutationWithClientMutationId({
    name: 'CancelSubscription',
    inputFields: {},
    outputFields: {
      subscription: { type: SubscriptionType },
      error: {
        type: CancelSubscriptionErrorType,
      },
    },
    async mutateAndGetPayload(_, { user, subscriptionByUserLoader }: Context) {
      const result = await cancelSubscription(user)

      if (user) {
        subscriptionByUserLoader.clear(user.id)
      }

      return result
    },
  }),
  updatePaymentMethod: mutationWithClientMutationId({
    name: 'UpdatePaymentMethod',
    inputFields: {
      cardDetails: { type: GraphQLNonNull(CardDetailsInput) },
    },
    outputFields: {
      error: { type: UpdatePaymentMethodErrorType },
      subscription: { type: SubscriptionType },
    },
    mutateAndGetPayload(args: UpdatePaymentMethodArgs, { user }: Context) {
      return updatePaymentMethod(user, args)
    },
  }),
}
