/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: NotesPagination_UserData
// ====================================================

export interface NotesPagination_UserData_userModels_fields {
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

export interface NotesPagination_UserData_userModels {
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
  fields: NotesPagination_UserData_userModels_fields[];
}

export interface NotesPagination_UserData_userDecks {
  __typename: "Deck";
  /**
   * The ID of an object
   */
  id: string;
  /**
   * Unique identifiable slug
   */
  slug: string;
  /**
   * Title of the deck
   */
  title: string;
}

export interface NotesPagination_UserData {
  /**
   * Retrieve all models for the logged user
   */
  userModels: NotesPagination_UserData_userModels[];
  /**
   * Retrieve all decks for the logged user
   */
  userDecks: NotesPagination_UserData_userDecks[];
}
