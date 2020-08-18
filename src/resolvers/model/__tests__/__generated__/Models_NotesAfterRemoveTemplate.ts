/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: Models_NotesAfterRemoveTemplate
// ====================================================

export interface Models_NotesAfterRemoveTemplate_updatedModel_notes_flashCards {
  __typename: "FlashCard";
  /**
   * The ID of an object
   */
  id: string;
}

export interface Models_NotesAfterRemoveTemplate_updatedModel_notes {
  __typename: "Note";
  /**
   * Generated flashcards
   */
  flashCards: Models_NotesAfterRemoveTemplate_updatedModel_notes_flashCards[];
}

export interface Models_NotesAfterRemoveTemplate_updatedModel {
  __typename: "Model";
  /**
   * Notes associated with this model
   */
  notes: Models_NotesAfterRemoveTemplate_updatedModel_notes[];
  /**
   * Total number of notes associated with this model
   */
  totalNotes: number;
  /**
   * Total number of flashcards associated with this model
   */
  totalFlashcards: number;
}

export interface Models_NotesAfterRemoveTemplate {
  /**
   * Get single model by it's id
   */
  updatedModel: Models_NotesAfterRemoveTemplate_updatedModel | null;
}

export interface Models_NotesAfterRemoveTemplateVariables {
  modelId: string;
}
