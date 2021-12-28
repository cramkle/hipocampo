import {
  GraphQLBoolean,
  GraphQLEnumType,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from 'graphql'

import type { UserDocument, UserPreferencesDocument } from '../../mongo/User'
import { graphQLGlobalIdField } from '../../utils/graphqlID'

export const UserRolesEnumType = new GraphQLEnumType({
  name: 'UserRoles',
  values: {
    REGULAR: {},
    ADMIN: {},
  },
})

export const UserPreferencesType =
  new GraphQLObjectType<UserPreferencesDocument>({
    name: 'UserPreferences',
    description: 'Preferences associated with user account',
    fields: {
      zoneInfo: {
        type: GraphQLNonNull(GraphQLString),
        description: 'User preferred timezone',
        resolve: (preferences) => preferences.zoneInfo ?? 'UTC',
      },
      locale: {
        type: GraphQLString,
        description: 'User preferred locale',
      },
      darkMode: {
        type: GraphQLNonNull(GraphQLBoolean),
        description: 'User preferred dark mode or not',
        resolve: (preferences) => preferences.darkMode ?? false,
      },
    },
  })

export const UserType = new GraphQLObjectType<UserDocument, Context>({
  name: 'User',
  description: 'User entity',
  fields: {
    id: graphQLGlobalIdField(),
    username: {
      type: GraphQLNonNull(GraphQLString),
      description: "User's username",
    },
    email: {
      type: GraphQLString,
      description: "User's email",
      resolve: (root, _, { user }) => {
        if (!(root._id?.equals(user?._id ?? '') ?? false)) {
          return null
        }

        return root.email
      },
    },
    roles: {
      type: GraphQLList(GraphQLNonNull(UserRolesEnumType)),
      resolve: (root, _, { user }) => {
        if (!(root._id?.equals(user?._id ?? '') ?? false)) {
          return null
        }

        return root.email
      },
    },
    preferences: {
      type: UserPreferencesType,
      resolve: (root, _, { user }) => {
        if (!(root._id?.equals(user?._id ?? '') ?? false)) {
          return null
        }

        const preferences = root.preferences ?? {}

        return preferences
      },
    },
    anonymous: {
      type: GraphQLNonNull(GraphQLBoolean),
      resolve: (user) => user.anonymous ?? false,
    },
  },
})
