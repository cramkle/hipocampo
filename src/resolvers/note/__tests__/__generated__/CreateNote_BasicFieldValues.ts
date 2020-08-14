/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { FieldValueInput } from "./../../../../globalTypes";

// ====================================================
// GraphQL mutation operation: CreateNote_BasicFieldValues
// ====================================================

export interface CreateNote_BasicFieldValues_createNote_note_values_field {
  __typename: "Field";
  /**
   * The ID of an object
   */
  id: string;
}

export interface CreateNote_BasicFieldValues_createNote_note_values_data_blocks {
  __typename: "Block";
  text: string;
}

export interface CreateNote_BasicFieldValues_createNote_note_values_data {
  __typename: "ContentState";
  blocks: CreateNote_BasicFieldValues_createNote_note_values_data_blocks[];
}

export interface CreateNote_BasicFieldValues_createNote_note_values {
  __typename: "FieldValue";
  /**
   * The ID of an object
   */
  id: string;
  /**
   * Associated field
   */
  field: CreateNote_BasicFieldValues_createNote_note_values_field | null;
  /**
   * Field data
   */
  data: CreateNote_BasicFieldValues_createNote_note_values_data | null;
}

export interface CreateNote_BasicFieldValues_createNote_note {
  __typename: "Note";
  /**
   * Note text representation
   */
  text: string | null;
  /**
   * Values of this note
   */
  values: CreateNote_BasicFieldValues_createNote_note_values[];
}

export interface CreateNote_BasicFieldValues_createNote {
  __typename: "CreateNotePayload";
  note: CreateNote_BasicFieldValues_createNote_note | null;
}

export interface CreateNote_BasicFieldValues {
  /**
   * Creates a new note in a deck
   */
  createNote: CreateNote_BasicFieldValues_createNote | null;
}

export interface CreateNote_BasicFieldValuesVariables {
  modelId: string;
  deckId: string;
  fieldValues: FieldValueInput[];
}
