import {
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from 'graphql'
import { mutationWithClientMutationId } from 'graphql-relay'
import { MongoError } from 'mongodb'
import { Error } from 'mongoose'

import { UserModel } from '../../mongo'
import { ErrorEnumType, ErrorValue } from '../../utils/error'
import { UserType } from './types'

interface CreateUserArgs {
  username: string
  email: string
  password: string
  zoneInfo: string
  locale?: string
}

const CreateUserErrorType = new GraphQLObjectType({
  name: 'CreateUserError',
  fields: {
    type: { type: GraphQLNonNull(ErrorEnumType) },
    status: { type: GraphQLNonNull(GraphQLInt) },
    fields: {
      type: GraphQLList(GraphQLNonNull(ErrorValue)),
    },
  },
})

export const createUser = mutationWithClientMutationId({
  name: 'CreateUser',
  description: 'Create a new user',
  inputFields: {
    username: {
      type: GraphQLNonNull(GraphQLString),
      description: "User's username",
    },
    email: { type: GraphQLNonNull(GraphQLString), description: "User's email" },
    password: {
      type: GraphQLNonNull(GraphQLString),
      description: "User's password",
    },
    locale: {
      type: GraphQLString,
      description: 'User preferred locale',
    },
    zoneInfo: {
      type: GraphQLString,
      description: 'User timezone',
      defaultValue: 'UTC',
    },
  },
  outputFields: {
    user: { type: UserType, description: 'Created user' },
    error: { type: CreateUserErrorType },
  },
  mutateAndGetPayload: async (
    { username, email, password, locale, zoneInfo }: CreateUserArgs,
    { t }: Context
  ) => {
    const user = new UserModel({
      username,
      email,
      password,
      preferences: { zoneInfo, locale },
    })

    try {
      await user?.validate()
    } catch (validation) {
      if (validation instanceof Error.ValidationError) {
        return {
          error: {
            type: 'BAD_INPUT',
            status: 400,
            fields: Object.values(validation.errors)
              .filter((validationError) => 'path' in validationError)
              .map((validationError) => ({
                fieldName: (validationError as any).path,
                errorDescription:
                  'properties' in validationError
                    ? t(validationError.properties.message)
                    : validationError.message,
              })),
          },
        }
      }
    }

    try {
      await user?.hashifyAndSave()
    } catch (err) {
      if (err instanceof MongoError) {
        // duplicate key error
        if (err.code === 11000) {
          const duplicatedKeys = (err as any).keyPattern as Record<
            string,
            unknown
          >

          return {
            error: {
              type: 'BAD_INPUT',
              status: 400,
              fields: [
                'username' in duplicatedKeys
                  ? {
                      fieldName: 'username',
                      errorDescription: t('usernameAlreadyRegistered'),
                    }
                  : undefined,
                'email' in duplicatedKeys
                  ? {
                      fieldName: 'email',
                      errorDescription: t('emailAlreadyRegistered'),
                    }
                  : undefined,
              ].filter(Boolean),
            },
          }
        }
      }

      console.error(err)

      return { error: { type: 'SERVER_ERROR', status: 500 } }
    }

    return { user }
  },
})
