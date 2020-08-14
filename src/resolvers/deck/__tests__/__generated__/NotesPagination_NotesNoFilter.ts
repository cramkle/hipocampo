/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: NotesPagination_NotesNoFilter
// ====================================================

export interface NotesPagination_NotesNoFilter_deck_notes_edges_node {
  __typename: "Note";
  /**
   * The ID of an object
   */
  id: string;
}

export interface NotesPagination_NotesNoFilter_deck_notes_edges {
  __typename: "NoteEdge";
  /**
   * The item at the end of the edge
   */
  node: NotesPagination_NotesNoFilter_deck_notes_edges_node | null;
}

export interface NotesPagination_NotesNoFilter_deck_notes {
  __typename: "NoteConnection";
  /**
   * A list of edges.
   */
  edges: (NotesPagination_NotesNoFilter_deck_notes_edges | null)[] | null;
  totalCount: number;
}

export interface NotesPagination_NotesNoFilter_deck {
  __typename: "Deck";
  /**
   * Notes contained in this deck
   */
  notes: NotesPagination_NotesNoFilter_deck_notes | null;
}

export interface NotesPagination_NotesNoFilter {
  /**
   * Get single deck by it's slug
   */
  deck: NotesPagination_NotesNoFilter_deck | null;
}

export interface NotesPagination_NotesNoFilterVariables {
  slug: string;
}
