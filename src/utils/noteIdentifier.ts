import { convertFromRaw } from 'draft-js'

import { NoteDocument } from '../mongo/Note'
import { getModelPrimaryField } from './modelPrimaryField'

export const getNoteIdentifier = async (
  note: NoteDocument,
  context: Context
): Promise<string> => {
  const noteModel = await context.modelLoader.load(note.modelId)

  const modelPrimaryField = await getModelPrimaryField(noteModel!, context)

  const primaryFieldValue = note.values.find((value) =>
    value.fieldId.equals(modelPrimaryField?._id)
  )

  if (!primaryFieldValue) {
    return note.id
  }

  const contentState = convertFromRaw({
    entityMap: {},
    ...(primaryFieldValue.data?.toJSON() ?? { blocks: [] }),
  })

  return contentState.getPlainText()
}
