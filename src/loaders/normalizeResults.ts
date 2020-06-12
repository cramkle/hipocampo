import { Document } from 'mongoose'

// Adapted from https://github.com/entria/graphql-mongoose-loader/blob/master/src/MongooseLoader.ts
// which is MIT licensed

function indexResults<T extends Document, K extends keyof T>(
  results: T[],
  indexField: K,
  cacheKeyFn: (value: T[K]) => string
) {
  const indexedResults = new Map<string, T>()
  results.forEach((res) => {
    indexedResults.set(cacheKeyFn(res[indexField]), res)
  })
  return indexedResults
}

export async function normalizeResults<T extends Document, K extends keyof T>(
  keys: ReadonlyArray<T[K]>,
  resultsPromise: T[] | PromiseLike<T[]>,
  indexField: K,
  cacheKeyFn: (value: T[K]) => string = (value: T[K]) =>
    (value as any).toString()
) {
  const results = await resultsPromise

  const indexedResults = indexResults(results, indexField, cacheKeyFn)

  return keys.map(
    (val) =>
      indexedResults.get(cacheKeyFn(val)) ?? new Error(`Key not found : ${val}`)
  )
}
