import {
  GraphQLBoolean,
  GraphQLInt,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from 'graphql'
import { mutationWithClientMutationId } from 'graphql-relay'

import { UserModel } from '../../mongo'
import { ErrorEnumType } from '../../utils/error'
import { UserType } from './types'

interface UpdatePreferencesInput {
  zoneInfo?: string
  locale?: string
  darkMode?: boolean
}

const UpdatePreferencesErrorType = new GraphQLObjectType({
  name: 'UpdatePreferencesError',
  fields: {
    type: { type: GraphQLNonNull(ErrorEnumType) },
    status: { type: GraphQLNonNull(GraphQLInt) },
  },
})

export const updatePreferences = mutationWithClientMutationId({
  name: 'UpdatePreferences',
  description: 'Update user account preferences',
  inputFields: {
    zoneInfo: {
      type: GraphQLString,
      description: 'User timezone',
    },
    darkMode: {
      type: GraphQLBoolean,
      description: 'Whether dark mode is on or off',
    },
    locale: {
      type: GraphQLString,
      description: 'User preferred locale',
    },
  },
  outputFields: {
    user: { type: UserType },
    error: { type: UpdatePreferencesErrorType },
  },
  mutateAndGetPayload: async (
    { zoneInfo, locale, darkMode }: UpdatePreferencesInput,
    { user }: Context
  ) => {
    if (!user) {
      return { error: { type: 'AUTHENTICATION', status: 403 } }
    }

    const updates: Record<string, unknown> = {}

    if (zoneInfo != null) {
      updates['preferences.zoneInfo'] = zoneInfo
    }

    if (locale != null) {
      updates['preferences.locale'] = locale
    }

    if (darkMode != null) {
      updates['preferences.darkMode'] = darkMode
    }

    const updatedUser = await UserModel.findOneAndUpdate(
      { _id: user._id },
      { $set: updates },
      { new: true }
    )

    return { user: updatedUser }
  },
})
