import type { ModelDocument } from '../mongo/Model'

export const getModelPrimaryField = async (
  model: ModelDocument,
  ctx: Context
) => {
  const modelFields = await ctx.fieldsByModelLoader.load(model._id)

  if (!model.primaryFieldId && !modelFields.length) {
    return null
  }

  if (model.primaryFieldId) {
    return modelFields.find(
      ({ _id }) => model.primaryFieldId === _id.toString()
    )
  }

  return modelFields[0]
}
