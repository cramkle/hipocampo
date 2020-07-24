import { GraphQLError, GraphQLFieldResolver } from 'graphql'

import { UserRoles } from '../mongo/User'

const UNAUTHENTICATED_MESSAGE = 'User is not authenticated'

type ContextWithUser = Omit<Context, 'user'> & Pick<Required<Context>, 'user'>

export function checkAuthAndResolve<T, U>(
  resolve: GraphQLFieldResolver<T, ContextWithUser, U>
): GraphQLFieldResolver<T, Context, U> {
  return (source, args, context, info) => {
    if (context.user == null) {
      throw new GraphQLError(UNAUTHENTICATED_MESSAGE)
    }

    return resolve(source, args, context as ContextWithUser, info)
  }
}

export function checkRoleAndResolve<T, U>(
  resolve: GraphQLFieldResolver<T, ContextWithUser, U>,
  roles: UserRoles[]
): GraphQLFieldResolver<T, Context, U> {
  return (source, args, context, info) => {
    if (context.user == null) {
      throw new GraphQLError(UNAUTHENTICATED_MESSAGE)
    }

    if (!context.user.roles.every((userRole) => roles.includes(userRole))) {
      throw new GraphQLError('User is not authorized for this resource')
    }

    return resolve(source, args, context as ContextWithUser, info)
  }
}
