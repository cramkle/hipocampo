import {
  GraphQLEnumType,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from 'graphql'

export const ErrorEnumType = new GraphQLEnumType({
  name: 'Error',
  description: 'Type of error',
  values: {
    serverError: {
      value: 'SERVER_ERROR',
    },
    authentication: {
      value: 'AUTHENTICATION',
    },
    badInput: {
      value: 'BAD_INPUT',
    },
  },
})

export const ErrorValue = new GraphQLObjectType({
  name: 'ErrorValue',
  fields: {
    fieldName: { type: GraphQLNonNull(GraphQLString) },
    errorDescription: { type: GraphQLNonNull(GraphQLString) },
  },
})
