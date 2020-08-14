/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: CreateNote_NoFieldsMutation
// ====================================================

export interface CreateNote_NoFieldsMutation_createNote_note_values {
  __typename: "FieldValue";
  /**
   * The ID of an object
   */
  id: string;
}

export interface CreateNote_NoFieldsMutation_createNote_note {
  __typename: "Note";
  /**
   * Values of this note
   */
  values: CreateNote_NoFieldsMutation_createNote_note_values[];
}

export interface CreateNote_NoFieldsMutation_createNote {
  __typename: "CreateNotePayload";
  note: CreateNote_NoFieldsMutation_createNote_note | null;
}

export interface CreateNote_NoFieldsMutation {
  /**
   * Creates a new note in a deck
   */
  createNote: CreateNote_NoFieldsMutation_createNote | null;
}

export interface CreateNote_NoFieldsMutationVariables {
  modelId: string;
  deckId: string;
}
