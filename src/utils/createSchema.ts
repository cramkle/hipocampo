/* eslint-disable @typescript-eslint/ban-types */

import type {
  Model,
  SchemaDefinition,
  SchemaDefinitionType,
  SchemaOptions,
} from 'mongoose'
import { Schema } from 'mongoose'

import type { UserDocument } from '../mongo/User'

interface CreateSchemaOptions<T> extends SchemaOptions {
  hasReadPermission?(
    user: UserDocument | undefined,
    obj: T
  ): boolean | Promise<boolean>
  hasWritePermission(
    user: UserDocument | undefined,
    obj: T
  ): boolean | Promise<boolean>
}

export interface SchemaMethods {
  canRead(user: UserDocument | undefined): Promise<boolean>
  canWrite(user: UserDocument | undefined): Promise<boolean>
}

export function createSchema<T extends SchemaMethods, TMethods = {}>(
  definition: SchemaDefinition<SchemaDefinitionType<T>>,
  { hasReadPermission, hasWritePermission, ...options }: CreateSchemaOptions<T>
) {
  const schema = new Schema<
    T,
    Model<T, any, any, any>,
    TMethods & SchemaMethods
  >(definition, options)

  schema.methods.canRead = function (user: UserDocument | undefined) {
    return (hasReadPermission ?? hasWritePermission)(user, this)
  }

  schema.methods.canWrite = function (user: UserDocument | undefined) {
    return hasWritePermission(user, this)
  }

  return schema
}
