import { v4 } from 'uuid'

import {
  DeckModel,
  FieldModel,
  ModelModel,
  TemplateModel,
  UserModel,
} from '../mongo'
import { defaultDeckConfig } from '../mongo/Deck'
import { draftContent, mention } from '../utils/draftUtils'

export const createUserWithData = async () => {
  const uuid = v4().replace('-', '_')

  const user = await UserModel.create({
    username: `testuser${uuid}`,
    password: 'hunter2',
    email: `test-user+${uuid}@cramkle.com`,
    roles: ['REGULAR'],
    preferences: {
      zoneInfo: 'UTC',
      locale: 'en',
      darkMode: false,
    },
    lastLogin: undefined,
    createdAt: new Date(),
  })

  await Promise.all(
    [1, 2, 3, 4].map((num) =>
      DeckModel.create({
        title: `Test deck ${num}`,
        slug: `test-deck-${num}`,
        description: 'Deck created for testing purposes',
        ownerId: user._id,
        published: false,
        configuration: defaultDeckConfig,
      })
    )
  )

  const model = await ModelModel.create({
    name: 'Basic',
    ownerId: user._id,
  })

  const modelFields = await Promise.all(
    ['Front', 'Back'].map((fieldName) => {
      return FieldModel.create({
        name: fieldName,
        modelId: model._id,
      })
    })
  )

  await TemplateModel.create({
    name: 'Template',
    modelId: model._id,
    ownerId: user._id,
    frontSide: draftContent`
${mention('Front')}
`(modelFields),
    backSide: draftContent`
${mention('Back')}
`(modelFields),
  })

  return user
}
