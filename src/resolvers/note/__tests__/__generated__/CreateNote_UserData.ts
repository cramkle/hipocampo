/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: CreateNote_UserData
// ====================================================

export interface CreateNote_UserData_userDecks {
  __typename: "Deck";
  /**
   * The ID of an object
   */
  id: string;
  /**
   * Title of the deck
   */
  title: string;
}

export interface CreateNote_UserData_userModels_fields {
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

export interface CreateNote_UserData_userModels {
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
  fields: CreateNote_UserData_userModels_fields[];
}

export interface CreateNote_UserData {
  /**
   * Retrieve all decks for the logged user
   */
  userDecks: CreateNote_UserData_userDecks[];
  /**
   * Retrieve all models for the logged user
   */
  userModels: CreateNote_UserData_userModels[];
}
