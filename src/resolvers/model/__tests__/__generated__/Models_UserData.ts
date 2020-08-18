/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: Models_UserData
// ====================================================

export interface Models_UserData_userModels_fields {
  __typename: "Field";
  /**
   * The ID of an object
   */
  id: string;
  /**
   * Name of the field
   */
  name: string;
}

export interface Models_UserData_userModels_templates {
  __typename: "Template";
  /**
   * The ID of an object
   */
  id: string;
  /**
   * Name of the template
   */
  name: string;
}

export interface Models_UserData_userModels {
  __typename: "Model";
  /**
   * The ID of an object
   */
  id: string;
  /**
   * Name of this card model (e.g. "Basic", "Basic with Reversed")
   */
  name: string | null;
  /**
   * Fields associated with this model
   */
  fields: Models_UserData_userModels_fields[];
  /**
   * Templates associated with this model
   */
  templates: Models_UserData_userModels_templates[];
}

export interface Models_UserData_userDecks {
  __typename: "Deck";
  /**
   * The ID of an object
   */
  id: string;
}

export interface Models_UserData {
  /**
   * Retrieve all models for the logged user
   */
  userModels: Models_UserData_userModels[];
  /**
   * Retrieve all decks for the logged user
   */
  userDecks: Models_UserData_userDecks[];
}
