import { GraphQLFieldConfig } from 'graphql'

import { UserModel } from '../../mongo'
import { checkAuthAndResolve } from '../../utils/auth'
import { UserType } from './types'

export const me: GraphQLFieldConfig<void, Context> = {
  type: UserType,
  description: 'Get currently logged user',
  resolve: checkAuthAndResolve(async (_, __, { user }) => {
    const dbUser = await UserModel.findById(user._id).exec()

    return dbUser
  }),
}
