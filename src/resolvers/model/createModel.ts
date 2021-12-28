import type { GraphQLFieldConfig } from 'graphql'
import { GraphQLList, GraphQLNonNull, GraphQLString } from 'graphql'
import { mutationWithClientMutationId } from 'graphql-relay'

import { FieldModel, ModelModel, TemplateModel } from '../../mongo'
import type { Field } from '../../mongo/Field'
import type { Template } from '../../mongo/Template'
import { FieldInputType } from '../field/types'
import { TemplateInputType } from '../template/types'
import { ModelType } from './types'

interface CreateModelInput {
  name: string
  fields: Field[]
  templates: Template[]
}

export const createModel: GraphQLFieldConfig<void, Context, CreateModelInput> =
  mutationWithClientMutationId({
    name: 'CreateModel',
    description: 'Create a new model',
    inputFields: {
      name: { type: GraphQLNonNull(GraphQLString), description: 'Model name' },
      fields: {
        type: GraphQLNonNull(GraphQLList(GraphQLNonNull(FieldInputType))),
        description: 'Fields',
      },
      templates: {
        type: GraphQLNonNull(GraphQLList(GraphQLNonNull(TemplateInputType))),
        description: 'Templates',
      },
    },
    outputFields: {
      model: { type: ModelType, description: 'Created model' },
    },
    mutateAndGetPayload: async (
      { name, fields, templates }: CreateModelInput,
      { user }: Context
    ) => {
      if (!user) {
        return { model: null }
      }

      const model = await ModelModel.create({
        name,
        ownerId: user._id,
      })

      await FieldModel.create(
        fields.map((field) => ({ ...field, modelId: model._id }))
      )

      await TemplateModel.create(
        templates.map((template) => ({
          ...template,
          modelId: model._id,
          ownerId: user?._id,
        }))
      )

      return { model }
    },
  })
