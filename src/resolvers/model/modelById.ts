import { GraphQLFieldConfig, GraphQLID, GraphQLNonNull } from 'graphql'
import { fromGlobalId } from 'graphql-relay'

import { ModelModel } from '../../mongo'
import { checkAuthAndResolve } from '../../utils/auth'
import { ModelType } from './types'

export const model: GraphQLFieldConfig<void, Context, { id: string }> = {
  type: ModelType,
  description: "Get single model by it's id",
  args: {
    id: { type: GraphQLNonNull(GraphQLID) },
  },
  resolve: checkAuthAndResolve(async (_, args, ctx: Context) => {
    const { id: modelId } = fromGlobalId(args.id)

    const model = await ModelModel.findOne({
      _id: modelId,
      ownerId: ctx.user!._id,
    })

    return model
  }),
}
