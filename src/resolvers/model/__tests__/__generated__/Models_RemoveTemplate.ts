/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: Models_RemoveTemplate
// ====================================================

export interface Models_RemoveTemplate_removeTemplateFromModel_template {
  __typename: "Template";
  /**
   * The ID of an object
   */
  id: string;
}

export interface Models_RemoveTemplate_removeTemplateFromModel {
  __typename: "RemoveTemplateFromModelPayload";
  template: Models_RemoveTemplate_removeTemplateFromModel_template | null;
}

export interface Models_RemoveTemplate {
  /**
   * Removes a template from it's model and delete associated flashcards
   */
  removeTemplateFromModel: Models_RemoveTemplate_removeTemplateFromModel | null;
}

export interface Models_RemoveTemplateVariables {
  templateId: string;
}
