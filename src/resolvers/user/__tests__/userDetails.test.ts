import gql from '../../../gql'
import { createUserWithData } from '../../../test/fakeUtils'
import { runQuery } from '../../../test/utils'

describe('User details', () => {
  let user: ReturnType<typeof createUserWithData> extends Promise<infer U>
    ? U
    : never

  beforeEach(async () => {
    user = await createUserWithData()
  })

  it('should correctly return user details', async () => {
    const query = gql`
      query UserDetails_CorrectUserDetails {
        me {
          id
          username
          email
          preferences {
            darkMode
          }
        }
      }
    `

    const result = await runQuery(query, { user })

    expect(result.me.username).toEqual(user.username)
    expect(result.me.email).toEqual(user.email)
    expect(result.me.preferences.darkMode).toEqual(user.preferences!.darkMode)
  })
})
