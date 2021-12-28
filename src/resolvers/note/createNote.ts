import { GraphQLID, GraphQLList, GraphQLNonNull } from 'graphql'
import { fromGlobalId, mutationWithClientMutationId } from 'graphql-relay'
import type { Types } from 'mongoose'

import {
  DeckModel,
  FieldModel,
  ModelModel,
  NoteModel,
  TemplateModel,
} from '../../mongo'
import { validateContentStateInput } from '../contentState/utils'
import { NoteType } from '../deck/types'
import { FieldValueInput } from '../fieldValue/types'

interface CreateNoteMutationInput {
  modelId: string
  deckId: string
  fieldValues: Array<{
    data: ContentStateInput
    field: {
      id: string
    }
  }>
}

export const createNote = mutationWithClientMutationId({
  name: 'CreateNote',
  description: 'Creates a new note in a deck',
  inputFields: {
    modelId: { type: GraphQLID, description: 'Model of the note' },
    deckId: { type: GraphQLID, description: 'Deck to add this note' },
    fieldValues: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(FieldValueInput))),
      description: 'Values of this note, according to the model fields',
    },
  },
  outputFields: { note: { type: NoteType } },
  mutateAndGetPayload: async (args: CreateNoteMutationInput, { user }) => {
    if (!user) {
      return { note: null }
    }

    const { id: deckId } = fromGlobalId(args.deckId)
    const { id: modelId } = fromGlobalId(args.modelId)

    const deck = await DeckModel.findOne({ _id: deckId, ownerId: user._id })
    const model = await ModelModel.findOne({
      _id: modelId,
      ownerId: user._id,
    })

    if (!deck || !model) {
      throw new Error('Model or deck not found')
    }

    const modelFields = await FieldModel.find({ modelId: model._id })
    const fieldValues = args.fieldValues.map((fieldValue) => {
      const { id: fieldId } = fromGlobalId(fieldValue.field.id)

      return {
        data: fieldValue.data,
        fieldId,
      }
    })

    const note = await NoteModel.create({
      modelId: model._id,
      deckId: deck._id,
      ownerId: user._id,
      values: modelFields.map((field) => {
        const modelFieldId = field._id as Types.ObjectId

        const fieldValue = fieldValues.find(
          ({ fieldId }) => fieldId === modelFieldId.toString()
        )

        if (!fieldValue) {
          return { data: undefined, fieldId: modelFieldId.toString() }
        }

        const contentState = fieldValue.data

        if (!validateContentStateInput(contentState)) {
          throw new Error('Invalid content state')
        }

        return {
          data: contentState,
          fieldId: fieldValue.fieldId,
        }
      }),
      flashCards: [],
    })

    const modelTemplates = await TemplateModel.find({ modelId: model._id })

    note.set(
      'flashCards',
      modelTemplates.map(({ _id: templateId }) => ({
        templateId,
        noteId: note._id,
      }))
    )

    await note.save()

    return { note }
  },
})
