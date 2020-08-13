import gql from '../../../gql'
import { runQuery } from '../../../test/utils'

describe('CreateUser mutation', () => {
  it('createUser successfully creates an user', async () => {
    const query = gql`
      mutation {
        createUser(
          input: {
            username: "lucas"
            email: "lucas@email.com"
            password: "hunter2"
          }
        ) {
          user {
            id
            username
            email
          }
        }
      }
    `

    const result = await runQuery(query)

    expect(result.createUser.user.id).toBeTruthy()
    expect(result.createUser.user.username).toBe('lucas')
    expect(result.createUser.user.email).toBe('lucas@email.com')
  })
})
