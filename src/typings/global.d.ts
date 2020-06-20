import type { UserDocument } from '../mongo/User'
import type { Loaders } from '../loaders/createLoaders'

declare global {
  interface Context extends Loaders {
    user?: UserDocument
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
    data: Record<string, unknown>
  }

  interface ContentStateInput {
    blocks: BlockInput[]
    entityMap: Record<string, unknown>
  }
}
