import {
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from 'graphql'

import { UserModel } from '../../mongo'
import type { ModelDocument } from '../../mongo/Model'
import { graphQLGlobalIdField } from '../../utils/graphqlID'
import { getModelPrimaryField } from '../../utils/modelPrimaryField'
import { NoteType } from '../deck/types'
import { FieldType } from '../field/types'
import { nodeInterface } from '../node/types'
import { TemplateType } from '../template/types'
import { UserType } from '../user/types'

export const ModelType: GraphQLObjectType<
  ModelDocument,
  Context
> = new GraphQLObjectType<ModelDocument, Context>({
  name: 'Model',
  description: 'Represents a model for a collection of notes.',
  interfaces: [nodeInterface],
  fields: () => ({
    id: graphQLGlobalIdField(),
    name: {
      type: GraphQLString,
      description:
        'Name of this card model (e.g. "Basic", "Basic with Reversed")',
    },
    owner: {
      type: UserType,
      description: 'Owner user entity',
      resolve: (root) => UserModel.findById(root.ownerId),
    },
    primaryField: {
      type: FieldType,
      description:
        'Primary field that should represent each individual note of this model.',
      resolve: (root, _, ctx) => getModelPrimaryField(root, ctx),
    },
    templates: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(TemplateType))),
      description: 'Templates associated with this model',
      resolve: (root, _, ctx) => ctx.templatesByModelLoader.load(root._id),
    },
    fields: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(FieldType))),
      description: 'Fields associated with this model',
      resolve: (root, _, ctx) => ctx.fieldsByModelLoader.load(root._id),
    },
    notes: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(NoteType))),
      description: 'Notes associated with this model',
      resolve: (root, _, ctx) => ctx.notesByModelLoader.load(root._id),
    },
    totalNotes: {
      type: GraphQLNonNull(GraphQLInt),
      description: 'Total number of notes associated with this model',
      resolve: (root, _, ctx) => ctx.countNotesByModelLoader.load(root._id),
    },
    totalFlashcards: {
      type: GraphQLNonNull(GraphQLInt),
      description: 'Total number of flashcards associated with this model',
      resolve: (root, _, ctx) =>
        ctx.countFlashcardsByModelLoader.load(root._id),
    },
  }),
})
