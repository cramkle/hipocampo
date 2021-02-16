import type { Request } from 'express'
import { Strategy } from 'passport'
import { v4 } from 'uuid'

import UserModel from '../mongo/User'

export class AnonymousStrategy extends Strategy {
  name = 'anonymous'

  authenticate(req: Request) {
    const username = v4()

    const zoneInfo = req.body.zoneInfo ?? 'UTC'
    const locale = req.body.locale ?? 'en'

    const anonymousUser = new UserModel({
      username: `anon${username}`,
      anonymous: true,
      email: `anonymous+${username}@cramkle.com`,
      password: '',
      preferences: { zoneInfo, locale },
    })

    anonymousUser
      .hashifyAndSave()
      .then((savedUser) => {
        this.success(savedUser)
      })
      .catch((err) => {
        console.error(err)

        this.fail(500)
      })
  }
}
