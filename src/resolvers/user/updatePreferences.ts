import { GraphQLError, GraphQLString } from 'graphql'
import { mutationWithClientMutationId } from 'graphql-relay'

import { UserModel } from '../../mongo'
import { UserType } from './types'

interface UpdatePreferencesInput {
  zoneInfo?: string
}

export const updatePreferences = mutationWithClientMutationId({
  name: 'UpdatePreferences',
  description: 'Update user account preferences',
  inputFields: {
    zoneInfo: {
      type: GraphQLString,
      description: 'User timezone',
    },
  },
  outputFields: {
    user: { type: UserType },
  },
  mutateAndGetPayload: async (
    { zoneInfo }: UpdatePreferencesInput,
    { user }: Context
  ) => {
    if (!user) {
      throw new GraphQLError('User not authenticated')
    }

    const updates: Record<string, unknown> = {}

    if (zoneInfo) {
      updates['preferences.zoneInfo'] = zoneInfo
    }

    const updatedUser = await UserModel.findOneAndUpdate(
      { _id: user._id },
      { $set: updates },
      { new: true }
    )

    return { user: updatedUser }
  },
})
