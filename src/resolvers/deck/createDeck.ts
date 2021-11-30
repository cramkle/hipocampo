import { GraphQLID, GraphQLNonNull, GraphQLString } from 'graphql'
import { fromGlobalId, mutationWithClientMutationId } from 'graphql-relay'

import {
  DeckModel,
  FieldModel,
  ModelModel,
  NoteModel,
  TemplateModel,
} from '../../mongo'
import type { ContentState } from '../../mongo/ContentState'
import { defaultDeckConfig } from '../../mongo/Deck'
import { DeckType } from './types'

export const createDeck = mutationWithClientMutationId({
  name: 'CreateDeck',
  description: 'Create a deck entity',
  inputFields: {
    title: { type: GraphQLNonNull(GraphQLString), description: 'Deck title' },
    description: { type: GraphQLString, description: 'Deck description' },
  },
  outputFields: {
    deck: { type: DeckType, description: 'Created deck' },
  },
  mutateAndGetPayload: async ({ title, description }, { user }: Context) => {
    const deck = await DeckModel.create({
      title,
      description,
      ownerId: user?._id,
      slug: '',
      published: false,
      configuration: defaultDeckConfig,
    })

    return { deck }
  },
})

export const importDeck = mutationWithClientMutationId({
  name: 'ImportDeck',
  description: 'Import/Duplicate a deck entity',
  inputFields: {
    id: { type: GraphQLNonNull(GraphQLID), description: 'Public deck id' },
  },
  outputFields: {
    deck: { type: DeckType, description: 'Imported deck' },
  },
  mutateAndGetPayload: async (
    { id },
    { user, publishedDeckLoader, modelLoader, fieldsByModelLoader }: Context
  ) => {
    const helperMap: {
      updateModelIndex: { oldId: string; newId: string }[]
      updateFieldIndex: { oldId: string; newId: string }[]
    } = {
      updateModelIndex: [],
      updateFieldIndex: [],
    }
    const { id: deckId } = fromGlobalId(id)
    const publishedDeck = await publishedDeckLoader.load(deckId)
    const deckNotes = await NoteModel.find({ deckId: publishedDeck?._id })

    // Find requires models/fields & templates
    const modelIds = deckNotes.map((note) => note.modelId.toString())
    const uniqueModelIds = modelIds.filter((v, i) => modelIds.indexOf(v) === i)
    const models = []

    for await (const modelId of uniqueModelIds) {
      const model = await modelLoader.load(modelId)
      const currentModelFields = await fieldsByModelLoader.load(model?._id)
      const currentModelTemplates = await TemplateModel.find({
        modelId: model?._id,
      })

      models.push({
        model,
        fields: currentModelFields,
        templates: currentModelTemplates,
      })
    }

    // Create deck
    const newDeck = await DeckModel.create({
      title: `${publishedDeck?.title} - new`,
      description: publishedDeck?.description,
      ownerId: user?._id,
      slug: '',
      published: false,
      configuration: defaultDeckConfig,
    })

    // Create models/fields & templates
    for await (const model of models) {
      // Create model
      const newModel = await ModelModel.create({
        name: `${model.model?.name} - copy`,
        ownerId: user?._id,
      })
      helperMap.updateModelIndex.push({
        oldId: model.model._id,
        newId: newModel._id,
      })

      // Create fields
      for await (const field of model.fields) {
        const currentField = await FieldModel.create({
          name: field.name,
          modelId: newModel._id,
        })
        helperMap.updateFieldIndex.push({
          oldId: field._id,
          newId: currentField._id,
        })
      }

      // Create templates
      for await (const template of model.templates) {
        const frontSideWithUpdatedEntities = updateEntitiesIds(
          helperMap.updateFieldIndex,
          template.frontSide
        )
        const backSideWithUpdatedEntities = updateEntitiesIds(
          helperMap.updateFieldIndex,
          template.backSide
        )

        await TemplateModel.create({
          name: template.name,
          modelId: newModel._id,
          ownerId: user?._id,
          frontSide: frontSideWithUpdatedEntities,
          backSide: backSideWithUpdatedEntities,
        })
      }
    }

    // Create notes
    for await (const note of deckNotes) {
      const currentNoteModelId = helperMap.updateModelIndex.find(
        (v) => `${v.oldId}` === `${note.modelId}`
      )?.newId

      const fieldValues = note.values.map((noteValue) => {
        const newFieldId = helperMap.updateFieldIndex.find(
          (v) => `${v.oldId}` === `${noteValue.fieldId}`
        )?.newId

        return {
          data: removeContentStateDocumentIds(noteValue.data),
          fieldId: newFieldId,
        }
      })

      const newNote = await NoteModel.create({
        modelId: currentNoteModelId,
        deckId: newDeck._id,
        ownerId: user!._id,
        values: fieldValues,
        flashCards: [],
      })

      // Create flashcards
      const modelTemplates = await TemplateModel.find({
        modelId: currentNoteModelId,
      })

      newNote.set(
        'flashCards',
        modelTemplates.map(({ _id: templateId }) => ({
          templateId,
          noteId: note._id,
        }))
      )

      await newNote.save()
    }
    return { deck: newDeck }
  },
})

const removeContentStateDocumentIds = (
  contentState: ContentStateInput | undefined
): ContentStateInput | undefined => {
  if (!contentState) return undefined
  const cleanBlocks = contentState.blocks.map((b) => {
    return {
      key: b.key,
      type: b.type,
      text: b.text,
      inlineStyleRanges: b.inlineStyleRanges,
      entityRanges: b.entityRanges,
      depth: b.depth,
      data: b.data,
    }
  })

  return {
    blocks: cleanBlocks,
  }
}

const updateEntitiesIds = (
  updateFieldIndex: { oldId: string; newId: string }[],
  contentState: ContentState | null
): ContentState | null => {
  if (!contentState) return null

  const newEntityMap = { ...contentState.entityMap }
  for (const i in newEntityMap) {
    const entityObject = newEntityMap[i]
    if (entityObject.type == 'TAG') {
      const oldId = entityObject.data.id
      const newId =
        updateFieldIndex.find((v) => `${v.oldId}` === `${oldId}`)?.newId ??
        oldId
      newEntityMap[i] = { ...entityObject, data: { id: newId } }
    }
  }

  return {
    blocks: contentState.blocks,
    entityMap: newEntityMap,
  }
}
