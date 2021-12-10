import { GraphQLID, GraphQLNonNull, GraphQLString } from 'graphql'
import { fromGlobalId, mutationWithClientMutationId } from 'graphql-relay'

import {
  DeckModel,
  FieldModel,
  ModelModel,
  NoteModel,
  TemplateModel,
} from '../../mongo'
import type {
  ContentState,
  ContentStateDocument,
} from '../../mongo/ContentState'
import { defaultDeckConfig } from '../../mongo/Deck'
import type { TemplateDocument } from '../../mongo/Template'
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

export const installDeck = mutationWithClientMutationId({
  name: 'InstallDeck',
  description: 'Install/Duplicate a deck entity',
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
      updateModelIndex: Record<string, string>
      updateFieldIndex: Record<string, string>
      modelTemplates: Record<string, TemplateDocument[]>
    } = {
      updateModelIndex: {},
      updateFieldIndex: {},
      modelTemplates: {},
    }
    const { id: deckId } = fromGlobalId(id)
    const publishedDeck = await publishedDeckLoader.load(deckId)

    if (!publishedDeck) {
      return { deck: null }
    }

    const deckNotes = await NoteModel.find({ deckId: publishedDeck?._id })

    // Find requires models/fields & templates
    const modelIds = deckNotes.map((note) => note.modelId.toString())
    const uniqueModelIds = modelIds.filter((v, i) => modelIds.indexOf(v) === i)

    const models = await Promise.all(
      uniqueModelIds.map(async (modelId) => {
        const model = await modelLoader.load(modelId)
        const currentModelFields = await fieldsByModelLoader.load(model?._id)
        const currentModelTemplates = await TemplateModel.find({
          modelId: model?._id,
        })

        return {
          model,
          fields: currentModelFields,
          templates: currentModelTemplates,
        }
      })
    )

    // Create deck
    const newDeck = await DeckModel.create({
      title: publishedDeck?.title,
      description: publishedDeck?.description,
      ownerId: user?._id,
      slug: '',
      published: false,
      configuration: defaultDeckConfig,
      originalDeckId: publishedDeck?._id,
    })

    // Create models/fields & templates
    await Promise.all(
      models.map(async (model) => {
        // Create model
        const newModel = await ModelModel.create({
          name: model.model?.name,
          ownerId: user?._id,
        })
        helperMap.updateModelIndex[model.model?._id] = newModel._id
        helperMap.modelTemplates[newModel._id] = []

        // Create fields
        await Promise.all(
          model.fields.map(async (field) => {
            const currentField = await FieldModel.create({
              name: field.name,
              modelId: newModel._id,
            })
            helperMap.updateFieldIndex[field._id] = currentField._id
          })
        )

        // Create templates
        await Promise.all(
          model.templates.map(async (template) => {
            const frontSideWithUpdatedEntities = updateEntitiesIds(
              helperMap.updateFieldIndex,
              template.frontSide
            )
            const backSideWithUpdatedEntities = updateEntitiesIds(
              helperMap.updateFieldIndex,
              template.backSide
            )

            const newTemplate = await TemplateModel.create({
              name: template.name,
              modelId: newModel._id,
              ownerId: user?._id,
              frontSide: frontSideWithUpdatedEntities,
              backSide: backSideWithUpdatedEntities,
            })

            // Save templates to create flashcards
            helperMap.modelTemplates[newModel._id].push(newTemplate)
          })
        )
      })
    )

    // Create notes
    await Promise.all(
      deckNotes.map(async (note) => {
        const currentNoteModelId =
          helperMap.updateModelIndex[note.modelId.toString()]

        const fieldValues = note.values.map((noteValue) => {
          const newFieldId =
            helperMap.updateFieldIndex[noteValue.fieldId.toString()]

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

        const currentModelTemplates =
          helperMap.modelTemplates[currentNoteModelId]

        newNote.set(
          'flashCards',
          currentModelTemplates.map(({ _id: templateId }) => ({
            templateId,
            noteId: note._id,
          }))
        )

        await newNote.save()
      })
    )
    return { deck: newDeck }
  },
})

const removeContentStateDocumentIds = (
  contentState: ContentStateDocument | undefined
): ContentStateInput | undefined => {
  if (!contentState) return undefined

  const cleanBlocks = contentState.blocks.map((blockDocument) => {
    const { _id, ...block } = blockDocument.toJSON()

    return block
  })

  return {
    blocks: cleanBlocks,
  }
}

const updateEntitiesIds = (
  updateFieldIndex: Record<string, string>,
  contentState: ContentState | null
): ContentState | null => {
  if (!contentState) return null

  const newEntityMap = { ...contentState.entityMap }
  for (const i in newEntityMap) {
    const entityObject = newEntityMap[i]
    if (entityObject.type == 'TAG') {
      const oldId = entityObject.data.id
      const newId = updateFieldIndex[oldId]
      newEntityMap[i] = { ...entityObject, data: { id: newId } }
    }
  }

  return {
    blocks: contentState.blocks,
    entityMap: newEntityMap,
  }
}
