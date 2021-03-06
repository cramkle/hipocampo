import {
  GraphQLInputObjectType,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from 'graphql'

import type { TemplateDocument } from '../../mongo/Template'
import { graphQLGlobalIdField } from '../../utils/graphqlID'
import { ContentStateType } from '../contentState/types'
import { ModelType } from '../model/types'
import { nodeInterface } from '../node/types'

export const TemplateType = new GraphQLObjectType<TemplateDocument, Context>({
  name: 'Template',
  description: `
Template of the card. This is what structures the content
of each card with values provided by the note
  `.trim(),
  interfaces: [nodeInterface],
  fields: () => ({
    id: graphQLGlobalIdField(),
    name: {
      type: GraphQLNonNull(GraphQLString),
      description: 'Name of the template',
    },
    frontSide: {
      type: ContentStateType,
      description: 'Front side template',
    },
    backSide: {
      type: ContentStateType,
      description: 'Back side template',
    },
    model: {
      type: GraphQLNonNull(ModelType),
      description: 'Associated model',
      resolve: (root, _, ctx) => ctx.modelLoader.load(root.modelId),
    },
  }),
})

export const TemplateInputType = new GraphQLInputObjectType({
  name: 'TemplateInput',
  fields: {
    name: { type: GraphQLNonNull(GraphQLString) },
  },
})
