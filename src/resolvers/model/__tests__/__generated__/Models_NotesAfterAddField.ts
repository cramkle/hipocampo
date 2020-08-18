/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: Models_NotesAfterAddField
// ====================================================

export interface Models_NotesAfterAddField_updatedModel_notes_values_field {
  __typename: "Field";
  /**
   * Name of the field
   */
  name: string;
}

export interface Models_NotesAfterAddField_updatedModel_notes_values {
  __typename: "FieldValue";
  /**
   * The ID of an object
   */
  id: string;
  /**
   * Associated field
   */
  field: Models_NotesAfterAddField_updatedModel_notes_values_field | null;
}

export interface Models_NotesAfterAddField_updatedModel_notes {
  __typename: "Note";
  /**
   * Values of this note
   */
  values: Models_NotesAfterAddField_updatedModel_notes_values[];
}

export interface Models_NotesAfterAddField_updatedModel {
  __typename: "Model";
  /**
   * Notes associated with this model
   */
  notes: Models_NotesAfterAddField_updatedModel_notes[];
  /**
   * Total number of notes associated with this model
   */
  totalNotes: number;
  /**
   * Total number of flashcards associated with this model
   */
  totalFlashcards: number;
}

export interface Models_NotesAfterAddField {
  /**
   * Get single model by it's id
   */
  updatedModel: Models_NotesAfterAddField_updatedModel | null;
}

export interface Models_NotesAfterAddFieldVariables {
  modelId: string;
}
