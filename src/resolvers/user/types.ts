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

export const UserType = new GraphQLObjectType<UserDocument>({
  name: 'User',
  description: 'User entity',
  fields: {
    id: graphQLGlobalIdField(),
    username: {
      type: GraphQLNonNull(GraphQLString),
      description: "User's username",
    },
    email: {
      type: GraphQLNonNull(GraphQLString),
      description: "User's email",
    },
    roles: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(UserRolesEnumType))),
    },
    preferences: {
      type: GraphQLNonNull(UserPreferencesType),
      resolve: (user) => user.preferences ?? {},
    },
    anonymous: {
      type: GraphQLNonNull(GraphQLBoolean),
      resolve: (user) => user.anonymous ?? false,
    },
  },
})
