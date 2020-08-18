/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: Models_AddTemplate
// ====================================================

export interface Models_AddTemplate_addTemplateToModel_template {
  __typename: "Template";
  /**
   * The ID of an object
   */
  id: string;
}

export interface Models_AddTemplate_addTemplateToModel {
  __typename: "AddTemplateToModelPayload";
  template: Models_AddTemplate_addTemplateToModel_template | null;
}

export interface Models_AddTemplate {
  /**
   * Adds a new template to a model
   */
  addTemplateToModel: Models_AddTemplate_addTemplateToModel | null;
}

export interface Models_AddTemplateVariables {
  modelId: string;
  templateName: string;
}
