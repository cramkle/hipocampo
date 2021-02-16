import gql from '../../../gql'
import type { UserDocument } from '../../../mongo/User'
import { createUserWithData } from '../../../test/fakeUtils'
import { runQuery } from '../../../test/utils'
import { draftContent } from '../../../utils/draftUtils'
import type {
  NotesPagination_UserData,
  NotesPagination_UserData_userDecks,
  NotesPagination_UserData_userModels,
} from './__generated__/NotesPagination_UserData'

describe('Notes pagination', () => {
  let user: UserDocument
  let models: NotesPagination_UserData_userModels[]
  let decks: NotesPagination_UserData_userDecks[]

  beforeEach(async () => {
    user = await createUserWithData()
    const { userModels, userDecks } = await runQuery<NotesPagination_UserData>(
      gql`
        query NotesPagination_UserData {
          userModels: models {
            id
            name
            fields {
              id
              name
            }
          }
          userDecks: decks {
            id
            slug
            title
          }
        }
      `,
      { user }
    )
    models = userModels
    decks = userDecks

    const [deck] = decks
    const [model] = models
    const [frontField, backField] = model.fields

    await Promise.all(
      [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) =>
        runQuery(
          gql`
            mutation NotesPagination_NoFilterCreateNote(
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

  it('should return all notes with no filter', async () => {
    const [deck] = decks

    const {
      deck: { notes },
    } = await runQuery(
      gql`
        query NotesPagination_NotesNoFilter($slug: String!) {
          deck(slug: $slug) {
            notes {
              edges {
                node {
                  id
                }
              }
              totalCount
            }
          }
        }
      `,
      { user },
      { slug: deck.slug }
    )

    expect(notes.totalCount).toBe(10)
  })

  it('should return total number of notes matched by search filter only', async () => {
    const [deck] = decks

    const {
      deck: { notes },
    } = await runQuery(
      gql`
        query NotesPagination_NotesBasicFilter($slug: String!) {
          deck(slug: $slug) {
            notes(search: "1") {
              edges {
                node {
                  id
                  text
                }
              }
              totalCount
              pageCursors {
                first {
                  page
                  isCurrent
                }
                around {
                  page
                  isCurrent
                }
                last {
                  page
                  isCurrent
                }
              }
            }
          }
        }
      `,
      { user },
      { slug: deck.slug }
    )

    expect(notes.totalCount).toBe(1)
    expect(notes.pageCursors.first).toBeNull()
    expect(notes.pageCursors.last).toBeNull()
    expect(notes.pageCursors.around).toEqual([
      expect.objectContaining({ page: 1, isCurrent: true }),
    ])
  })
})
