/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { FieldValueInput } from "./../../../../globalTypes";

// ====================================================
// GraphQL mutation operation: NotesPagination_NoFilterCreateNote
// ====================================================

export interface NotesPagination_NoFilterCreateNote_createNote_note {
  __typename: "Note";
  /**
   * The ID of an object
   */
  id: string;
}

export interface NotesPagination_NoFilterCreateNote_createNote {
  __typename: "CreateNotePayload";
  note: NotesPagination_NoFilterCreateNote_createNote_note | null;
}

export interface NotesPagination_NoFilterCreateNote {
  /**
   * Creates a new note in a deck
   */
  createNote: NotesPagination_NoFilterCreateNote_createNote | null;
}

export interface NotesPagination_NoFilterCreateNoteVariables {
  modelId: string;
  deckId: string;
  fieldValues: FieldValueInput[];
}
