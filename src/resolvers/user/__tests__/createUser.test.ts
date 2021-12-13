import gql from '../../../gql'
import { runQuery } from '../../../test/utils'

describe('CreateUser mutation', () => {
  it('createUser successfully creates an user', async () => {
    const query = gql`
      mutation CreateUser_BasicCreateUser {
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

    expect(result.createUser.user.id).toStrictEqual(expect.any(String))
    expect(result.createUser.user.username).toBe('lucas')
    expect(result.createUser.user.email).toBeNull()
  })

  it('createUser errors on duplicated usernames', async () => {
    const query = gql`
      mutation CreateUser_DuplicateCreateUser {
        createUser(
          input: {
            username: "myuser"
            email: "user_email@email.com"
            password: "hunter2"
          }
        ) {
          user {
            id
            username
            email
          }
          error {
            type
            status
            fields {
              fieldName
              errorDescription
            }
          }
        }
      }
    `

    const result = await runQuery(query)

    expect(result.createUser.user.id).toStrictEqual(expect.any(String))
    expect(result.createUser.user.username).toBe('myuser')
    expect(result.createUser.user.email).toBeNull()

    const secondResult = await runQuery(query)

    expect(secondResult.createUser.user).toBeNull()
    expect(secondResult.createUser.error.type).toBe('badInput')
    expect(secondResult.createUser.error.fields).toStrictEqual(
      expect.arrayContaining([
        expect.objectContaining({
          fieldName: 'username',
          errorDescription: expect.any(String),
        }),
      ])
    )
  })
})
