/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: NotesPagination_NotesBasicFilter
// ====================================================

export interface NotesPagination_NotesBasicFilter_deck_notes_edges_node {
  __typename: "Note";
  /**
   * The ID of an object
   */
  id: string;
  /**
   * Note text representation
   */
  text: string | null;
}

export interface NotesPagination_NotesBasicFilter_deck_notes_edges {
  __typename: "NoteEdge";
  /**
   * The item at the end of the edge
   */
  node: NotesPagination_NotesBasicFilter_deck_notes_edges_node | null;
}

export interface NotesPagination_NotesBasicFilter_deck_notes_pageCursors_first {
  __typename: "PageCursor";
  page: number;
  isCurrent: boolean;
}

export interface NotesPagination_NotesBasicFilter_deck_notes_pageCursors_around {
  __typename: "PageCursor";
  page: number;
  isCurrent: boolean;
}

export interface NotesPagination_NotesBasicFilter_deck_notes_pageCursors_last {
  __typename: "PageCursor";
  page: number;
  isCurrent: boolean;
}

export interface NotesPagination_NotesBasicFilter_deck_notes_pageCursors {
  __typename: "PageCursors";
  /**
   * Optional, may be included in `around` (if current page is near the beginning).
   */
  first: NotesPagination_NotesBasicFilter_deck_notes_pageCursors_first | null;
  /**
   * Always includes current page
   */
  around: NotesPagination_NotesBasicFilter_deck_notes_pageCursors_around[];
  /**
   * Optional, may be included in `around` (if current page is near the end).
   */
  last: NotesPagination_NotesBasicFilter_deck_notes_pageCursors_last | null;
}

export interface NotesPagination_NotesBasicFilter_deck_notes {
  __typename: "NoteConnection";
  /**
   * A list of edges.
   */
  edges: (NotesPagination_NotesBasicFilter_deck_notes_edges | null)[] | null;
  totalCount: number;
  pageCursors: NotesPagination_NotesBasicFilter_deck_notes_pageCursors;
}

export interface NotesPagination_NotesBasicFilter_deck {
  __typename: "Deck";
  /**
   * Notes contained in this deck
   */
  notes: NotesPagination_NotesBasicFilter_deck_notes | null;
}

export interface NotesPagination_NotesBasicFilter {
  /**
   * Get single deck by it's slug
   */
  deck: NotesPagination_NotesBasicFilter_deck | null;
}

export interface NotesPagination_NotesBasicFilterVariables {
  slug: string;
}
