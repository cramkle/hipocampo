import { raw } from 'body-parser'
import type { Request, Response } from 'express'
import { Router } from 'express'
import type Stripe from 'stripe'

import config from '../../config'
import { UserModel } from '../../mongo'
import { stripe } from '../../utils/stripe'
import { InvoiceModel, SubscriptionModel } from './entities'

export const subscriptionRouter = Router()

subscriptionRouter.post(
  '/stripe-webhook',
  raw({ type: 'application/json' }),
  async (req: Request, res: Response) => {
    // Retrieve the event by verifying the signature using the raw body and secret.
    let event

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        req.headers['stripe-signature']!,
        config['STRIPE_WEBHOOK_SECRET']
      )
    } catch (err) {
      console.error(err)
      console.error(`⚠️  Webhook signature verification failed.`)
      console.error(
        `⚠️  Check the env file and enter the correct webhook secret.`
      )
      return res.sendStatus(400)
    }

    // Extract the object from the event.
    const dataObject = event.data.object

    // Handle the event
    // Review important events for Billing webhooks
    // https://stripe.com/docs/billing/webhooks
    switch (event.type) {
      case 'invoice.paid': {
        // Used to provision services after the trial has ended.
        // The status of the invoice will show up as paid. Store the status in your
        // database to reference when a user accesses your service to avoid hitting rate limits.

        const invoiceObject = dataObject as Stripe.Invoice

        if (
          await InvoiceModel.exists({ 'stripeInvoice.id': invoiceObject.id })
        ) {
          // Invoice already in the DB, most likely this is the first invoice of
          // the subscription and was inserted in the createSubscription method
          break
        }

        const user = await UserModel.findOne({
          stripeCustomerId: invoiceObject.customer as string,
        })

        if (!user) {
          break
        }

        const userSubscription = await SubscriptionModel.findOne({
          userId: user.id,
        })

        if (!userSubscription) {
          break
        }

        const stripeSubscription = await stripe.subscriptions.retrieve(
          invoiceObject.subscription as string
        )

        const {
          headers,
          lastResponse,
          ...paymentIntent
        } = await stripe.paymentIntents.retrieve(
          invoiceObject.payment_intent as string,
          { expand: ['payment_method'] }
        )

        invoiceObject.payment_intent = paymentIntent

        userSubscription.status = 'active'
        userSubscription.subscriptionPeriodEnd =
          stripeSubscription.current_period_end

        await userSubscription.save()

        await InvoiceModel.create({
          userId: user.id,
          stripeInvoice: invoiceObject,
        })

        break
      }
      case 'invoice.payment_action_required': {
        const invoiceObject = dataObject as Stripe.Invoice

        if (
          (invoiceObject.payment_intent as Stripe.PaymentIntent).status ===
          'requires_payment_method'
        ) {
          // update subscription
          const subscription = await SubscriptionModel.findOne({
            stripeSubscriptionId: invoiceObject.subscription as string,
          })

          if (!subscription) {
            break
          }

          subscription.status = 'payment_required'
          subscription.paymentIntentClientSecret = (invoiceObject.payment_intent as Stripe.PaymentIntent).client_secret

          subscription.save()
        }
        break
      }
      case 'invoice.payment_failed': {
        // If the payment fails or the customer does not have a valid payment method,
        // an invoice.payment_failed event is sent, the subscription becomes past_due.
        // Use this webhook to notify your user that their payment has
        // failed and to retrieve new card details.
        console.log('payment failed', dataObject)

        const invoiceObject = dataObject as Stripe.Invoice

        const user = await UserModel.findOne({
          stripeCustomerId: invoiceObject.customer as string,
        })

        if (!user) {
          break
        }

        const userSubscription = await SubscriptionModel.findOne({
          userId: user.id,
        })

        if (!userSubscription) {
          break
        }

        userSubscription.status = 'payment_required'

        await userSubscription.save()

        break
      }
      case 'customer.subscription.deleted': {
        if (event.request != null) {
          // handle a subscription cancelled by your request
          // from above.
        } else {
          // handle subscription cancelled automatically based
          // upon your subscription settings.
        }
        break
      }
      default:
      // Unexpected event type
    }
    res.sendStatus(200)
  }
)
