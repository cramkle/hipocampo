import type { GraphQLFieldConfig } from 'graphql'
import { GraphQLID, GraphQLNonNull, GraphQLString } from 'graphql'
import { fromGlobalId, mutationWithClientMutationId } from 'graphql-relay'
import { Types } from 'mongoose'

import { NoteModel, TemplateModel } from '../../mongo'
import { TemplateType } from '../template/types'

interface AddTemplateInput {
  modelId: string
  name: string
}

export const addTemplateToModel: GraphQLFieldConfig<
  void,
  Context,
  AddTemplateInput
> = mutationWithClientMutationId({
  name: 'AddTemplateToModel',
  description: 'Adds a new template to a model',
  inputFields: {
    modelId: { type: GraphQLNonNull(GraphQLID), description: 'Model id' },
    name: { type: GraphQLNonNull(GraphQLString), description: 'Template name' },
  },
  outputFields: {
    template: { type: TemplateType },
  },
  mutateAndGetPayload: async (
    args: AddTemplateInput,
    { user, modelLoader }: Context
  ) => {
    if (!user) {
      return { template: null }
    }

    const { id: modelId } = fromGlobalId(args.modelId)

    const model = await modelLoader.load(modelId)

    const template = await TemplateModel.create({
      name: args.name,
      modelId: model._id,
      ownerId: user._id,
      frontSide: null,
      backSide: null,
    })

    await NoteModel.updateMany({ modelId }, [
      {
        $set: {
          flashCards: {
            $concatArrays: [
              '$flashCards',
              [
                {
                  // Apparently mongodb isn't creating
                  // an id for the subdocument when it
                  // is created using the `$concatArrays`
                  // aggregation operator
                  _id: new Types.ObjectId(),
                  templateId: template._id,
                  noteId: '$_id',
                },
              ],
            ],
          },
        },
      },
    ] as any)

    return { template }
  },
})
