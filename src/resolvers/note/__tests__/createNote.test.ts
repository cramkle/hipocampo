import gql from '../../../gql'
import { UserDocument } from '../../../mongo/User'
import { createUserWithData } from '../../../test/fakeUtils'
import { runQuery } from '../../../test/utils'
import { draftContent } from '../../../utils/draftUtils'
import {
  CreateNote_BasicFieldValues,
  CreateNote_BasicFieldValuesVariables,
} from './__generated__/CreateNote_BasicFieldValues'
import {
  CreateNote_UserData_userDecks,
  CreateNote_UserData_userModels,
} from './__generated__/CreateNote_UserData'

describe('createNote', () => {
  let user: UserDocument
  let decks: CreateNote_UserData_userDecks[]
  let models: CreateNote_UserData_userModels[]

  beforeAll(async () => {
    user = await createUserWithData()
    const { userDecks, userModels } = await runQuery(
      gql`
        query CreateNote_UserData {
          userDecks: decks {
            id
            title
          }
          userModels: models {
            id
            name
            fields {
              id
              name
            }
          }
        }
      `,
      { user }
    )

    decks = userDecks
    models = userModels
  })

  it('should create note with corresponding model fields', async () => {
    const query = gql`
      mutation CreateNote_NoFieldsMutation($modelId: ID!, $deckId: ID!) {
        createNote(
          input: { modelId: $modelId, deckId: $deckId, fieldValues: [] }
        ) {
          note {
            values {
              id
            }
          }
        }
      }
    `

    const result = await runQuery(
      query,
      { user },
      { modelId: models[0].id, deckId: decks[0].id }
    )

    expect(result.createNote.note.values).toHaveLength(2)
  })

  it('should properly create note with field values', async () => {
    const [model] = models
    const [frontField, backField] = model.fields

    const { createNote } = await runQuery<
      CreateNote_BasicFieldValues,
      CreateNote_BasicFieldValuesVariables
    >(
      gql`
        mutation CreateNote_BasicFieldValues(
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
              text
              values {
                id
                field {
                  id
                }
                data {
                  blocks {
                    text
                  }
                }
              }
            }
          }
        }
      `,
      { user },
      {
        modelId: model.id,
        deckId: decks[0].id,
        fieldValues: [
          {
            data: draftContent`Front field value`(),
            field: frontField,
          },
          {
            data: draftContent`Back field value`(),
            field: backField,
          },
        ],
      }
    )

    const note = createNote!.note!

    expect(note.values).toHaveLength(2)
    expect(note.text).toBe('Front field value')
    expect(note.values).toStrictEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: {
            id: frontField.id,
          },
          data: {
            blocks: expect.arrayContaining([
              expect.objectContaining({ text: 'Front field value' }),
            ]),
          },
        }),
        expect.objectContaining({
          field: {
            id: backField.id,
          },
          data: {
            blocks: expect.arrayContaining([
              expect.objectContaining({ text: 'Back field value' }),
            ]),
          },
        }),
      ])
    )
  })
})
