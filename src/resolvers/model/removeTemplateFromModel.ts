import type { GraphQLFieldConfig } from 'graphql'
import { GraphQLError, GraphQLID, GraphQLNonNull } from 'graphql'
import { fromGlobalId, mutationWithClientMutationId } from 'graphql-relay'

import { NoteModel, TemplateModel } from '../../mongo'
import { TemplateType } from '../template/types'

interface RemoveTemplateInput {
  templateId: string
}

export const removeTemplateFromModel: GraphQLFieldConfig<
  void,
  Context,
  RemoveTemplateInput
> = mutationWithClientMutationId({
  name: 'RemoveTemplateFromModel',
  description:
    "Removes a template from it's model and delete associated flashcards",
  inputFields: {
    templateId: { type: GraphQLNonNull(GraphQLID), description: 'Template id' },
  },
  outputFields: {
    template: { type: TemplateType },
  },
  mutateAndGetPayload: async (args: RemoveTemplateInput, { user }: Context) => {
    const { id: templateId } = fromGlobalId(args.templateId)

    const template = await TemplateModel.findOne({
      _id: templateId,
      ownerId: user!._id,
    })

    if (!template) {
      throw new GraphQLError('Template not found')
    }

    await NoteModel.updateMany(
      {
        modelId: template.modelId.toString(),
      },
      { $pull: { flashCards: { templateId: template._id } } }
    )

    await template.remove()

    return { template }
  },
})
