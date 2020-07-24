import { GraphQLFieldConfig, GraphQLList, GraphQLNonNull } from 'graphql'

import { ModelModel } from '../../mongo'
import { checkAuthAndResolve } from '../../utils/auth'
import { ModelType } from './types'

export const models: GraphQLFieldConfig<void, Context> = {
  type: GraphQLNonNull(GraphQLList(GraphQLNonNull(ModelType))),
  description: 'Retrieve all models for the logged user',
  resolve: checkAuthAndResolve(async (_, __, { user }) => {
    return ModelModel.find({ ownerId: user!._id })
  }),
}
