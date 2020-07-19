import {
  GraphQLEnumType,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from 'graphql'

import { UserDocument, UserPreferencesDocument } from '../../mongo/User'
import { graphQLGlobalIdField } from '../../utils/graphqlID'
import { nodeInterface } from '../node/types'

export const UserRolesEnumType = new GraphQLEnumType({
  name: 'UserRoles',
  values: {
    REGULAR: {},
    ADMIN: {},
  },
})

export const UserPreferencesType = new GraphQLObjectType<
  UserPreferencesDocument
>({
  name: 'UserPreferences',
  description: 'Preferences associated with user account',
  fields: {
    zoneInfo: {
      type: GraphQLNonNull(GraphQLString),
      description: 'User prefered timezone',
      resolve: (preferences) => preferences.zoneInfo ?? 'UTC',
    },
  },
})

export const UserType = new GraphQLObjectType<UserDocument>({
  name: 'User',
  description: 'User entity',
  interfaces: [nodeInterface],
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
  },
})
