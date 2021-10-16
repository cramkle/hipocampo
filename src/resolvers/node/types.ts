import { fromGlobalId, nodeDefinitions } from 'graphql-relay'
import type { Document } from 'mongoose'

import { NoteModel } from '../../mongo'
import { getConnection } from '../../mongo/connection'
import type { SchemaMethods } from '../../utils/createSchema'

const { nodeInterface, nodeField } = nodeDefinitions(
  async (globalId, context: Context) => {
    const { type: typeName, id: objectId } = fromGlobalId(globalId)

    const mongoose = await getConnection()

    let document: Document | null

    if (typeName === 'FlashCard') {
      const note = await NoteModel.findOne({ 'flashCards._id': objectId })

      if (note && (await note.canRead(context.user))) {
        document = note.flashCards.id(objectId)
      } else {
        document = null
      }
    } else {
      const documentModel = mongoose.model(typeName)
      document = await documentModel.findById(objectId)

      if (document != null && 'canRead' in document) {
        const documentWithCanRead = document as unknown as Document &
          SchemaMethods

        if (!(await documentWithCanRead.canRead(context.user))) {
          return null
        }
      }
    }

    if (!document) {
      return null
    }

    return { id: globalId, ...document?.toObject?.() }
  },
  (root) => {
    const { type: typeName } = fromGlobalId(root.id)

    return typeName
  }
)

export { nodeInterface, nodeField }
