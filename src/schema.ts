import { GraphQLObjectType, GraphQLSchema } from 'graphql'
import { GraphQLJSON, GraphQLJSONObject } from 'graphql-type-json'

import { createDeck } from './resolvers/deck/createDeck'
import { deck } from './resolvers/deck/deckBySlug'
import { deleteDeck } from './resolvers/deck/deleteDeck'
import { decks } from './resolvers/deck/listDecks'
import { publishDeck, unpublishDeck } from './resolvers/deck/publish'
import { updateDeck } from './resolvers/deck/updateDeck'
import { updateField } from './resolvers/field/updateField'
import { updateFieldValue } from './resolvers/fieldValue/updateFieldValue'
import { addFieldToModel } from './resolvers/model/addFieldToModel'
import { addTemplateToModel } from './resolvers/model/addTemplateToModel'
import { createModel } from './resolvers/model/createModel'
import { deleteModel } from './resolvers/model/deleteModel'
import { models } from './resolvers/model/listModels'
import { model } from './resolvers/model/modelById'
import { removeFieldFromModel } from './resolvers/model/removeFieldFromModel'
import { removeTemplateFromModel } from './resolvers/model/removeTemplateFromModel'
import { updateModel } from './resolvers/model/updateModel'
import { nodeField, nodeInterface } from './resolvers/node/types'
import { createNote } from './resolvers/note/createNote'
import { deleteNote } from './resolvers/note/deleteNote'
import { note } from './resolvers/note/noteById'
import { deckStatistics } from './resolvers/statistics/deckStatistics'
import { answerFlashCard } from './resolvers/study/answerFlashCard'
import { studyFlashCard } from './resolvers/study/studyFlashCard'
import { template } from './resolvers/template/template'
import { updateTemplate } from './resolvers/template/updateTemplate'
import { createUser } from './resolvers/user/createUser'
import { me } from './resolvers/user/me'
import { requestPasswordReset } from './resolvers/user/requestPasswordReset'
import { resetPassword } from './resolvers/user/resetPassword'
import { updatePreferences } from './resolvers/user/updatePreferences'
import { updateProfile } from './resolvers/user/updateProfile'

const schema = new GraphQLSchema({
  query: new GraphQLObjectType({
    name: 'Query',
    fields: {
      deck: deck,
      deckStatistics: deckStatistics,
      decks: decks,
      me: me,
      model: model,
      models: models,
      node: nodeField,
      note: note,
      studyFlashCard: studyFlashCard,
      template: template,
    } as any,
  }),
  mutation: new GraphQLObjectType<any, Context>({
    name: 'Mutation',
    fields: {
      addFieldToModel: addFieldToModel,
      addTemplateToModel: addTemplateToModel,
      answerFlashCard: answerFlashCard,
      createDeck: createDeck,
      createModel: createModel,
      createNote: createNote,
      createUser: createUser,
      deleteDeck: deleteDeck,
      deleteModel: deleteModel,
      deleteNote: deleteNote,
      publishDeck: publishDeck,
      removeFieldFromModel: removeFieldFromModel,
      removeTemplateFromModel: removeTemplateFromModel,
      requestPasswordReset: requestPasswordReset,
      resetPassword: resetPassword,
      unpublishDeck: unpublishDeck,
      updateDeck: updateDeck,
      updateField: updateField,
      updateFieldValue: updateFieldValue,
      updateModel: updateModel,
      updatePreferences: updatePreferences,
      updateProfile: updateProfile,
      updateTemplate: updateTemplate,
    } as any,
  }),
  types: [GraphQLJSON, GraphQLJSONObject, nodeInterface],
})

export default schema
