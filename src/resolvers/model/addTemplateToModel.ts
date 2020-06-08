import {
  GraphQLFieldConfig,
  GraphQLID,
  GraphQLNonNull,
  GraphQLString,
} from 'graphql'
import { fromGlobalId, mutationWithClientMutationId } from 'graphql-relay'

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
    const { id: modelId } = fromGlobalId(args.modelId)

    const model = await modelLoader.load(modelId)

    const template = await TemplateModel.create({
      name: args.name,
      modelId: model._id,
      ownerId: user?._id,
      frontSide: null,
      backSide: null,
    })

    const modelNotes = await NoteModel.find({ modelId })

    await Promise.all(
      modelNotes.map((note) => {
        return note.update({
          $push: { flashCards: { templateId: template._id, noteId: note._id } },
        })
      })
    )

    return { template }
  },
})
