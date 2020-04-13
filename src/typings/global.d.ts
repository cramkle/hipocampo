import { UserModel } from '../models'

declare global {
  interface Context {
    user?: UserModel
  }

  namespace Express {
    interface User extends UserDocument {
      _id: string
      username: string
    }
  }

  interface BlockInput {
    key: string
    type: string
    text: string
    depth: number
    inlineStyleRanges: InlineStyleRangeInput[]
    entityRanges: EntityRangeInput[]
    data: object
  }

  interface ContentStateInput {
    blocks: BlockInput[]
    entityMap: object
  }
}