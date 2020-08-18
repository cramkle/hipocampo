/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { FieldValueInput } from "./../../../../globalTypes";

// ====================================================
// GraphQL mutation operation: Models_BaseUserNotes
// ====================================================

export interface Models_BaseUserNotes_createNote_note {
  __typename: "Note";
  /**
   * The ID of an object
   */
  id: string;
}

export interface Models_BaseUserNotes_createNote {
  __typename: "CreateNotePayload";
  note: Models_BaseUserNotes_createNote_note | null;
}

export interface Models_BaseUserNotes {
  /**
   * Creates a new note in a deck
   */
  createNote: Models_BaseUserNotes_createNote | null;
}

export interface Models_BaseUserNotesVariables {
  modelId: string;
  deckId: string;
  fieldValues: FieldValueInput[];
}
