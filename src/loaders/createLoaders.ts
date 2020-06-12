import DataLoader from 'dataloader'
import _ from 'lodash'
import { Types } from 'mongoose'

import {
  DeckModel,
  FieldModel,
  ModelModel,
  NoteModel,
  TemplateModel,
} from '../mongo'
import { DeckDocument } from '../mongo/Deck'
import { FieldDocument } from '../mongo/Field'
import { ModelDocument } from '../mongo/Model'
import { NoteDocument } from '../mongo/Note'
import { TemplateDocument } from '../mongo/Template'
import { mongoIdCacheKeyFn } from './mongoIdCacheKeyFn'
import { normalizeResults } from './normalizeResults'

export interface Loaders {
  deckLoader: DataLoader<Types.ObjectId, DeckDocument>
  deckBySlugLoader: DataLoader<string, DeckDocument>
  modelLoader: DataLoader<Types.ObjectId | string, ModelDocument>
  templateLoader: DataLoader<Types.ObjectId, TemplateDocument>
  templatesByModelLoader: DataLoader<Types.ObjectId, TemplateDocument[]>
  fieldLoader: DataLoader<Types.ObjectId, FieldDocument>
  fieldsByModelLoader: DataLoader<Types.ObjectId, FieldDocument[]>
  noteLoader: DataLoader<Types.ObjectId, NoteDocument>
  notesByModelLoader: DataLoader<Types.ObjectId, NoteDocument[]>
  notesByDeckLoader: DataLoader<Types.ObjectId | string, NoteDocument[]>
}

export function createLoaders(user?: Express.User): Loaders {
  return {
    deckLoader: new DataLoader(
      (deckIds) => {
        return normalizeResults(
          deckIds,
          DeckModel.find({
            _id: { $in: Array.from(deckIds) },
            ownerId: user?._id,
          }),
          '_id',
          mongoIdCacheKeyFn
        )
      },
      { cacheKeyFn: mongoIdCacheKeyFn }
    ),
    deckBySlugLoader: new DataLoader((slugs) => {
      return normalizeResults(
        slugs,
        DeckModel.find({
          slug: { $in: Array.from(slugs) },
          ownerId: user?._id,
        }),
        'slug'
      )
    }),
    fieldLoader: new DataLoader((fieldIds) => {
      return normalizeResults(
        fieldIds,
        FieldModel.find({ _id: { $in: Array.from(fieldIds) } }),
        '_id',
        mongoIdCacheKeyFn
      )
    }),
    fieldsByModelLoader: new DataLoader(
      async (modelIds) => {
        const fields = await FieldModel.find({
          modelId: { $in: Array.from(modelIds) },
        })

        const fieldsByModel = _.groupBy(fields, 'modelId')

        return modelIds.map(
          (modelId) => fieldsByModel[modelId.toString()] || []
        )
      },
      { cacheKeyFn: mongoIdCacheKeyFn }
    ),
    modelLoader: new DataLoader(
      (modelIds) => {
        return normalizeResults(
          modelIds,
          ModelModel.find({
            _id: { $in: Array.from(modelIds) },
            ownerId: user?._id,
          }),
          '_id',
          mongoIdCacheKeyFn
        )
      },
      { cacheKeyFn: mongoIdCacheKeyFn }
    ),
    templatesByModelLoader: new DataLoader(
      async (modelIds) => {
        const templates = await TemplateModel.find({
          modelId: { $in: Array.from(modelIds) },
          ownerId: user?._id,
        })

        const templatesByModel = _.groupBy(templates, 'modelId')

        return modelIds.map(
          (modelId) => templatesByModel[modelId.toString()] || []
        )
      },
      { cacheKeyFn: mongoIdCacheKeyFn }
    ),
    templateLoader: new DataLoader(
      (templateIds) => {
        return normalizeResults(
          templateIds,
          TemplateModel.find({
            _id: { $in: Array.from(templateIds) },
            ownerId: user?._id,
          }),
          '_id',
          mongoIdCacheKeyFn
        )
      },
      { cacheKeyFn: mongoIdCacheKeyFn }
    ),
    noteLoader: new DataLoader(
      (noteIds) => {
        return normalizeResults(
          noteIds,
          NoteModel.find({
            _id: { $in: Array.from(noteIds) },
            ownerId: user?._id,
          }),
          '_id',
          mongoIdCacheKeyFn
        )
      },
      { cacheKeyFn: mongoIdCacheKeyFn }
    ),
    notesByModelLoader: new DataLoader(
      async (modelIds) => {
        const notes = await NoteModel.find({
          modelId: { $in: Array.from(modelIds) },
          ownerId: user?._id,
        })

        const notesByModel = _.groupBy(notes, 'modelId')

        return modelIds.map((modelId) => notesByModel[modelId.toString()] || [])
      },
      { cacheKeyFn: mongoIdCacheKeyFn }
    ),
    notesByDeckLoader: new DataLoader(
      async (deckIds) => {
        const notes = await NoteModel.find({
          deckId: { $in: Array.from(deckIds) },
          ownerId: user?._id,
        })

        const notesByDeck = _.groupBy(notes, 'deckId')

        return deckIds.map((deckId) => notesByDeck[deckId.toString()] || [])
      },
      { cacheKeyFn: mongoIdCacheKeyFn }
    ),
  }
}
