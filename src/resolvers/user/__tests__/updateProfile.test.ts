import gql from '../../../gql'
import type { UserDocument } from '../../../mongo/User'
import { createUserWithData } from '../../../test/fakeUtils'
import { runQuery } from '../../../test/utils'

describe('UpdateProfile mutation', () => {
  let user: UserDocument

  beforeEach(async () => {
    user = await createUserWithData()
  })

  it('updateProfile successfully updates the user profile', async () => {
    const query = gql`
      mutation UpdateProfile_UsernameUpdate {
        updateProfile(input: { username: "mytestupdate" }) {
          user {
            id
            username
          }
        }
      }
    `

    const result = await runQuery(query, { user })

    expect(result.updateProfile.user.username).toBe('mytestupdate')
  })

  it('can update the user password', async () => {
    const query = gql`
      mutation UpdateProfile_PasswordUpdate {
        updateProfile(
          input: { currentPassword: "hunter2", password: "hunter3" }
        ) {
          user {
            id
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

    let result

    try {
      result = await runQuery(query, { user })
    } catch (err) {
      fail(err)
    }

    expect(result.updateProfile.error).toBeNull()
    expect(result.updateProfile.user.id).toStrictEqual(expect.any(String))
  })

  it('errors on incorrect password', async () => {
    const query = gql`
      mutation UpdateProfile_PasswordUpdate {
        updateProfile(
          input: { currentPassword: "hunter3", password: "hunter2" }
        ) {
          user {
            id
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

    let result

    try {
      result = await runQuery(query, { user })
    } catch (err) {
      fail(err)
    }

    expect(result.updateProfile.user).toBeNull()
    expect(result.updateProfile.error.fields).toStrictEqual(
      expect.arrayContaining([
        expect.objectContaining({
          fieldName: 'currentPassword',
          errorDescription: expect.any(String),
        }),
      ])
    )
  })

  it('updateProfile errors on duplicated usernames', async () => {
    const newUser = await createUserWithData()

    const result = await runQuery(
      gql`
        mutation UpdateProfile_DuplicateCreateUserUpdate {
          updateProfile(input: { username: "${newUser.username}" }) {
            user {
              id
              username
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
      `,
      { user }
    )

    expect(result.updateProfile.user).toBeNull()
    expect(result.updateProfile.error.type).toBe('badInput')
    expect(result.updateProfile.error.status).toBe(400)
    expect(result.updateProfile.error.fields).toStrictEqual(
      expect.arrayContaining([
        expect.objectContaining({
          fieldName: 'username',
          errorDescription: expect.any(String),
        }),
      ])
    )
  })
})
