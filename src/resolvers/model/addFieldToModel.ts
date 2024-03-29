import type { GraphQLFieldConfig } from 'graphql'
import { GraphQLError, GraphQLID, GraphQLNonNull, GraphQLString } from 'graphql'
import { fromGlobalId, mutationWithClientMutationId } from 'graphql-relay'

import { FieldModel, ModelModel, NoteModel } from '../../mongo'
import { FieldType } from '../field/types'

interface AddFieldInput {
  modelId: string
  name: string
}

export const addFieldToModel: GraphQLFieldConfig<void, Context, AddFieldInput> =
  mutationWithClientMutationId({
    name: 'AddFieldToModel',
    description: 'Adds a new fields to a model',
    inputFields: {
      modelId: { type: GraphQLNonNull(GraphQLID), description: 'Model id' },
      name: { type: GraphQLNonNull(GraphQLString), description: 'Field name' },
    },
    outputFields: {
      field: { type: FieldType },
    },
    mutateAndGetPayload: async (args: AddFieldInput, { user }: Context) => {
      if (!user) {
        return { field: null }
      }

      const { id: modelId } = fromGlobalId(args.modelId)

      const model = await ModelModel.findOne({
        _id: modelId,
        ownerId: user._id,
      })

      if (!model) {
        throw new GraphQLError('Model not found')
      }

      const field = await FieldModel.create({
        name: args.name,
        modelId: model._id,
      })

      await NoteModel.updateMany(
        {
          modelId: model._id,
        },
        { $push: { values: { fieldId: field._id } } }
      )

      return { field }
    },
  })
