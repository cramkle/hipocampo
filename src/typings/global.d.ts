import type { UserDocument } from '../mongo/User'
import type { Loaders } from '../loaders/createLoaders'
import type { I18NextRequest } from 'i18next-http-middleware'

declare global {
  interface Context extends Loaders, I18NextRequest {
    user?: UserDocument
  }

  namespace Express {
    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    interface User extends UserDocument {}
  }

  interface BlockInput {
    key: string
    type: string
    text: string
    depth: number
    inlineStyleRanges: InlineStyleRangeInput[]
    entityRanges: EntityRangeInput[]
    data?: Record<string, unknown>
  }

  interface ContentStateInput {
    blocks: BlockInput[]
    entityMap?: Record<string, unknown>
  }
}
