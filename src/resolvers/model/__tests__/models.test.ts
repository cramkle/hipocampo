import gql from '../../../gql'
import { UserDocument } from '../../../mongo/User'
import { createUserWithData } from '../../../test/fakeUtils'
import { runQuery } from '../../../test/utils'
import { draftContent } from '../../../utils/draftUtils'
import {
  Models_AddField,
  Models_AddFieldVariables,
} from './__generated__/Models_AddField'
import {
  Models_AddTemplate,
  Models_AddTemplateVariables,
} from './__generated__/Models_AddTemplate'
import {
  Models_NotesAfterAddField,
  Models_NotesAfterAddFieldVariables,
} from './__generated__/Models_NotesAfterAddField'
import {
  Models_NotesAfterAddTemplate,
  Models_NotesAfterAddTemplateVariables,
} from './__generated__/Models_NotesAfterAddTemplate'
import {
  Models_NotesAfterRemoveField,
  Models_NotesAfterRemoveFieldVariables,
} from './__generated__/Models_NotesAfterRemoveField'
import {
  Models_NotesAfterRemoveTemplate,
  Models_NotesAfterRemoveTemplateVariables,
} from './__generated__/Models_NotesAfterRemoveTemplate'
import {
  Models_RemoveField,
  Models_RemoveFieldVariables,
} from './__generated__/Models_RemoveField'
import {
  Models_RemoveTemplate,
  Models_RemoveTemplateVariables,
} from './__generated__/Models_RemoveTemplate'
import {
  Models_UserData,
  Models_UserData_userModels,
} from './__generated__/Models_UserData'

describe('Models', () => {
  let user: UserDocument
  let models: Models_UserData_userModels[]

  beforeEach(async () => {
    user = await createUserWithData()

    const { userModels, userDecks } = await runQuery<Models_UserData>(
      gql`
        query Models_UserData {
          userModels: models {
            id
            name
            fields {
              id
              name
            }
            templates {
              id
              name
            }
          }
          userDecks: decks {
            id
          }
        }
      `,
      { user }
    )
    models = userModels
    const [model] = models
    const [deck] = userDecks

    const [frontField, backField] = model.fields

    await Promise.all(
      [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) =>
        runQuery(
          gql`
            mutation Models_BaseUserNotes(
              $modelId: ID!
              $deckId: ID!
              $fieldValues: [FieldValueInput!]!
            ) {
              createNote(
                input: {
                  modelId: $modelId
                  deckId: $deckId
                  fieldValues: $fieldValues
                }
              ) {
                note {
                  id
                }
              }
            }
          `,
          { user },
          {
            deckId: deck.id,
            modelId: model.id,
            fieldValues: [
              {
                data: draftContent`a ${num}`(),
                field: frontField,
              },
              {
                data: draftContent`b ${num}`(),
                field: backField,
              },
            ],
          }
        )
      )
    )
  })

  describe('Remove templates', () => {
    it('should remove flashcards from the notes after deleting template', async () => {
      const [model] = models

      await runQuery<Models_RemoveTemplate, Models_RemoveTemplateVariables>(
        gql`
          mutation Models_RemoveTemplate($templateId: ID!) {
            removeTemplateFromModel(input: { templateId: $templateId }) {
              template {
                id
              }
            }
          }
        `,
        { user },
        { templateId: model.templates[0].id }
      )

      const { updatedModel } = await runQuery<
        Models_NotesAfterRemoveTemplate,
        Models_NotesAfterRemoveTemplateVariables
      >(
        gql`
          query Models_NotesAfterRemoveTemplate($modelId: ID!) {
            updatedModel: model(id: $modelId) {
              notes {
                flashCards {
                  id
                }
              }
              totalNotes
              totalFlashcards
            }
          }
        `,
        { user },
        { modelId: model.id }
      )

      expect(updatedModel!.totalNotes).toEqual(10)
      expect(updatedModel!.totalFlashcards).toEqual(0)

      updatedModel!.notes.forEach((note) => {
        expect(note).toEqual(
          expect.objectContaining({
            flashCards: [],
          })
        )
      })
    })
  })

  describe('Add templates', () => {
    it('should add flashcards to the notes after creating template', async () => {
      const [model] = models

      await runQuery<Models_AddTemplate, Models_AddTemplateVariables>(
        gql`
          mutation Models_AddTemplate($modelId: ID!, $templateName: String!) {
            addTemplateToModel(
              input: { modelId: $modelId, name: $templateName }
            ) {
              template {
                id
              }
            }
          }
        `,
        { user },
        { modelId: model.id, templateName: 'My template' }
      )

      const { updatedModel } = await runQuery<
        Models_NotesAfterAddTemplate,
        Models_NotesAfterAddTemplateVariables
      >(
        gql`
          query Models_NotesAfterAddTemplate($modelId: ID!) {
            updatedModel: model(id: $modelId) {
              notes {
                flashCards {
                  id
                  template {
                    name
                  }
                }
              }
              totalNotes
              totalFlashcards
            }
          }
        `,
        { user },
        { modelId: model.id }
      )

      expect(updatedModel!.totalNotes).toEqual(10)
      expect(updatedModel!.totalFlashcards).toEqual(20)

      updatedModel!.notes.forEach((note) => {
        expect(note).toEqual(
          expect.objectContaining({
            flashCards: expect.arrayContaining([
              expect.objectContaining({
                id: expect.any(String),
                template: {
                  name: 'My template',
                },
              }),
            ]),
          })
        )
      })
    })
  })

  describe('Remove fields', () => {
    it('should remove field from notes after model updates', async () => {
      const [model] = models

      const fieldToRemove = model.fields[0]

      await runQuery<Models_RemoveField, Models_RemoveFieldVariables>(
        gql`
          mutation Models_RemoveField($fieldId: ID!) {
            removeFieldFromModel(input: { fieldId: $fieldId }) {
              field {
                id
              }
            }
          }
        `,
        { user },
        { fieldId: fieldToRemove.id }
      )

      const { updatedModel } = await runQuery<
        Models_NotesAfterRemoveField,
        Models_NotesAfterRemoveFieldVariables
      >(
        gql`
          query Models_NotesAfterRemoveField($modelId: ID!) {
            updatedModel: model(id: $modelId) {
              notes {
                values {
                  id
                  field {
                    name
                  }
                }
              }
              totalNotes
              totalFlashcards
            }
          }
        `,
        { user },
        { modelId: model.id }
      )

      expect(updatedModel!.totalNotes).toEqual(10)
      expect(updatedModel!.totalFlashcards).toEqual(10)

      updatedModel!.notes.forEach((note) => {
        expect(note).not.toEqual(
          expect.objectContaining({
            values: expect.arrayContaining([
              expect.objectContaining({
                field: {
                  name: fieldToRemove.name,
                },
              }),
            ]),
          })
        )
      })
    })
  })

  describe('Add fields', () => {
    it('should add field to notes after model updates', async () => {
      const [model] = models

      await runQuery<Models_AddField, Models_AddFieldVariables>(
        gql`
          mutation Models_AddField($modelId: ID!, $fieldName: String!) {
            addFieldToModel(input: { modelId: $modelId, name: $fieldName }) {
              field {
                id
              }
            }
          }
        `,
        { user },
        { modelId: model.id, fieldName: 'My new field' }
      )

      const { updatedModel } = await runQuery<
        Models_NotesAfterAddField,
        Models_NotesAfterAddFieldVariables
      >(
        gql`
          query Models_NotesAfterAddField($modelId: ID!) {
            updatedModel: model(id: $modelId) {
              notes {
                values {
                  id
                  field {
                    name
                  }
                }
              }
              totalNotes
              totalFlashcards
            }
          }
        `,
        { user },
        { modelId: model.id }
      )

      expect(updatedModel!.totalNotes).toEqual(10)
      expect(updatedModel!.totalFlashcards).toEqual(10)

      updatedModel!.notes.forEach((note) => {
        expect(note).toEqual(
          expect.objectContaining({
            values: expect.arrayContaining([
              expect.objectContaining({
                field: {
                  name: 'My new field',
                },
              }),
            ]),
          })
        )
      })
    })
  })
})
