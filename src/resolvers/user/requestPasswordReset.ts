import { GraphQLBoolean, GraphQLString } from 'graphql'
import { mutationWithClientMutationId } from 'graphql-relay'
import type { Types } from 'mongoose'

import { sendMail } from '../../modules/mail/transporter'
import { UserModel } from '../../mongo'
import { createHashWithTimestamp } from './utils'

interface RequestPasswordResetArgs {
  email: string
}

export const requestPasswordReset = mutationWithClientMutationId({
  name: 'RequestPasswordReset',
  description: 'Request a user password reset given an email',
  inputFields: {
    email: { type: GraphQLString, description: "User's email" },
  },
  outputFields: {
    success: {
      type: GraphQLBoolean,
      description: 'Whether we could successfully send the email or not',
    },
  },
  mutateAndGetPayload: async ({ email }: RequestPasswordResetArgs) => {
    const user = await UserModel.findOne({ email })

    if (!user) {
      return { success: false }
    }

    const userId = user._id as Types.ObjectId

    const todayTimestamp = Date.now()

    const hashString = createHashWithTimestamp(todayTimestamp, user)

    const passwordResetToken = `${todayTimestamp.toString(36)}-${hashString}`

    sendMail({
      to: user.email,
      subject: 'Cramkle - Password Reset',
      text: `
Hello ${user.username},

To reset your account's password, go to the following address:

https://www.cramkle.com/reset-password/${userId}?token=${passwordResetToken}

If you didn't request this password reset, contact support@cramkle.com.

Best regards,
Cramkle Team
`.trim(),
    }).then(
      (info) => {
        console.log('Email sent successfully', info)
      },
      (err) => {
        console.error(`Error sending email: ${err}`)
      }
    )

    return { success: true }
  },
})
