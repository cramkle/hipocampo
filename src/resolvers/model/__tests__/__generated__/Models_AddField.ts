/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: Models_AddField
// ====================================================

export interface Models_AddField_addFieldToModel_field {
  __typename: "Field";
  /**
   * The ID of an object
   */
  id: string;
}

export interface Models_AddField_addFieldToModel {
  __typename: "AddFieldToModelPayload";
  field: Models_AddField_addFieldToModel_field | null;
}

export interface Models_AddField {
  /**
   * Adds a new fields to a model
   */
  addFieldToModel: Models_AddField_addFieldToModel | null;
}

export interface Models_AddFieldVariables {
  modelId: string;
  fieldName: string;
}
