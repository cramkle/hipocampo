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
import { stripe } from '../../utils/stripe'
import { UserType } from './types'

interface UpdateProfileInput {
  email: string
  username: string
  password: string
  currentPassword: string
}

const UpdateProfileErrorType = new GraphQLObjectType({
  name: 'UpdateProfileError',
  fields: {
    type: { type: GraphQLNonNull(ErrorEnumType) },
    status: { type: GraphQLNonNull(GraphQLInt) },
    fields: {
      type: GraphQLList(GraphQLNonNull(ErrorValue)),
    },
  },
})

export const updateProfile = mutationWithClientMutationId({
  name: 'UpdateProfile',
  description: 'Update user profile information',
  inputFields: {
    email: {
      type: GraphQLString,
      description: 'New email',
    },
    username: { type: GraphQLString, description: 'New username' },
    password: { type: GraphQLString, description: 'New password' },
    currentPassword: {
      type: GraphQLString,
      description: 'Current password',
    },
  },
  outputFields: {
    user: { type: UserType },
    error: { type: UpdateProfileErrorType },
  },
  mutateAndGetPayload: async (
    { email, username, password, currentPassword }: UpdateProfileInput,
    { user, t }: Context
  ) => {
    if (!user) {
      return { error: { type: 'AUTHENTICATION', status: 403 } }
    }

    const userModel = (await UserModel.findOne({ _id: user._id }))!

    const updateProps: Partial<
      Omit<UpdateProfileInput, 'currentPassword'> & { anonymous: boolean }
    > = {}

    if (userModel.anonymous) {
      if (email == null || username == null || password == null) {
        return { error: { type: 'BAD_INPUT', status: 400 } }
      }

      updateProps.anonymous = false
    }

    if (email != null) {
      updateProps.email = email
    }

    if (username != null) {
      updateProps.username = username
    }

    if (password != null) {
      if (
        !userModel.anonymous &&
        !(await userModel.comparePassword(currentPassword))
      ) {
        return {
          error: {
            type: 'BAD_INPUT',
            status: 400,
            fields: [
              {
                fieldName: 'currentPassword',
                errorDescription: t('currentPasswordIsIncorrect'),
              },
            ],
          },
        }
      }

      updateProps.password = password
    }

    try {
      Object.assign(userModel, updateProps)

      try {
        await userModel.validate()
      } catch (validation) {
        if (validation instanceof Error.ValidationError) {
          return {
            error: {
              type: 'BAD_INPUT',
              status: 400,
              fields: Object.values(validation.errors).map(
                (validationError) => ({
                  fieldName: validationError.path,
                  errorDescription:
                    'properties' in validationError
                      ? t(validationError.properties.message)
                      : validationError.message,
                })
              ),
            },
          }
        }
      }

      if ('password' in updateProps) {
        await userModel?.hashifyAndSave()
      } else {
        await userModel?.save()
      }

      if (user.stripeCustomerId) {
        await stripe.customers.update(user.stripeCustomerId, {
          name: userModel.username,
          email: userModel.email,
        })
      }

      return { user: userModel }
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
  },
})
