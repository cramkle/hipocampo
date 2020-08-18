/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: Models_RemoveField
// ====================================================

export interface Models_RemoveField_removeFieldFromModel_field {
  __typename: "Field";
  /**
   * The ID of an object
   */
  id: string;
}

export interface Models_RemoveField_removeFieldFromModel {
  __typename: "RemoveFieldFromModelPayload";
  field: Models_RemoveField_removeFieldFromModel_field | null;
}

export interface Models_RemoveField {
  /**
   * Removes the field from it's model
   */
  removeFieldFromModel: Models_RemoveField_removeFieldFromModel | null;
}

export interface Models_RemoveFieldVariables {
  fieldId: string;
}
