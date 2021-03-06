import type { GraphQLFieldConfig } from 'graphql'
import { globalIdField as relayGlobalIdField } from 'graphql-relay'
import type { Types } from 'mongoose'

export const graphQLGlobalIdField = (
  typeName?: string
): GraphQLFieldConfig<{ _id?: Types.ObjectId }, Context> => {
  return relayGlobalIdField(typeName, (root) => root._id.toString())
}
