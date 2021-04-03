import {
  GraphQLBoolean,
  GraphQLEnumType,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from 'graphql'
import {
  connectionDefinitions,
  connectionFromArraySlice,
  cursorToOffset,
  forwardConnectionArgs,
} from 'graphql-relay'

import { InvoiceModel } from '../../modules/subscription/entities'
import {
  InvoiceType,
  SubscriptionType,
} from '../../modules/subscription/graphql'
import type { UserDocument, UserPreferencesDocument } from '../../mongo/User'
import { graphQLGlobalIdField } from '../../utils/graphqlID'
import { nodeInterface } from '../node/types'

export const UserRolesEnumType = new GraphQLEnumType({
  name: 'UserRoles',
  values: {
    REGULAR: {},
    ADMIN: {},
  },
})

export const UserPreferencesType = new GraphQLObjectType<UserPreferencesDocument>(
  {
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
  }
)

const invoiceConnection = connectionDefinitions({
  nodeType: InvoiceType,
  connectionFields: {
    totalCount: { type: GraphQLNonNull(GraphQLInt) },
  },
})

export const UserType = new GraphQLObjectType<UserDocument, Context>({
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
    anonymous: {
      type: GraphQLNonNull(GraphQLBoolean),
      resolve: (user) => user.anonymous ?? false,
    },
    subscription: {
      type: SubscriptionType,
      resolve: (user, _, context) =>
        context.subscriptionByUserLoader.load(user.id).catch(() => null),
    },
    invoices: {
      type: GraphQLNonNull(invoiceConnection.connectionType),
      args: forwardConnectionArgs,
      resolve: (async (
        user: UserDocument,
        args: { after: string | null; first: number }
      ) => {
        const totalCount = await InvoiceModel.find({
          userId: user.id,
        }).countDocuments()

        const invoices = await InvoiceModel.find({ userId: user.id })
          .skip(args.after ? cursorToOffset(args.after) : 0)
          .limit(args.first ?? 10)

        return Object.assign(
          {},
          connectionFromArraySlice(invoices, args, {
            sliceStart: 0,
            arrayLength: totalCount,
          }),
          { totalCount }
        )
      }) as any,
    },
  },
})
