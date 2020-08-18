/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: Models_NotesAfterAddTemplate
// ====================================================

export interface Models_NotesAfterAddTemplate_updatedModel_notes_flashCards_template {
  __typename: "Template";
  /**
   * Name of the template
   */
  name: string;
}

export interface Models_NotesAfterAddTemplate_updatedModel_notes_flashCards {
  __typename: "FlashCard";
  /**
   * The ID of an object
   */
  id: string;
  /**
   * Template associated with this flashcard.
   */
  template: Models_NotesAfterAddTemplate_updatedModel_notes_flashCards_template | null;
}

export interface Models_NotesAfterAddTemplate_updatedModel_notes {
  __typename: "Note";
  /**
   * Generated flashcards
   */
  flashCards: Models_NotesAfterAddTemplate_updatedModel_notes_flashCards[];
}

export interface Models_NotesAfterAddTemplate_updatedModel {
  __typename: "Model";
  /**
   * Notes associated with this model
   */
  notes: Models_NotesAfterAddTemplate_updatedModel_notes[];
  /**
   * Total number of notes associated with this model
   */
  totalNotes: number;
  /**
   * Total number of flashcards associated with this model
   */
  totalFlashcards: number;
}

export interface Models_NotesAfterAddTemplate {
  /**
   * Get single model by it's id
   */
  updatedModel: Models_NotesAfterAddTemplate_updatedModel | null;
}

export interface Models_NotesAfterAddTemplateVariables {
  modelId: string;
}
