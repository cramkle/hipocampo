import gql from '../../../gql'
import { DeckDocument } from '../../../mongo/Deck'
import { ModelDocument } from '../../../mongo/Model'
import { UserDocument } from '../../../mongo/User'
import { createUserWithData } from '../../../test/fake'
import { runQuery } from '../../../test/utils'

describe('createNote', () => {
  let user: UserDocument
  let decks: DeckDocument[]
  let models: ModelDocument[]

  beforeAll(async () => {
    user = await createUserWithData()
    const { userDecks, userModels } = await runQuery(
      gql`
        query {
          userDecks: decks {
            id
            title
          }
          userModels: models {
            id
            name
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
      mutation CreateNoteMutation($modelId: ID!, $deckId: ID!) {
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
})
