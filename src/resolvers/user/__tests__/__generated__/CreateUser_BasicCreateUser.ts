/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: CreateUser_BasicCreateUser
// ====================================================

export interface CreateUser_BasicCreateUser_createUser_user {
  __typename: "User";
  /**
   * The ID of an object
   */
  id: string;
  /**
   * User's username
   */
  username: string;
  /**
   * User's email
   */
  email: string;
}

export interface CreateUser_BasicCreateUser_createUser {
  __typename: "CreateUserPayload";
  /**
   * Created user
   */
  user: CreateUser_BasicCreateUser_createUser_user | null;
}

export interface CreateUser_BasicCreateUser {
  /**
   * Create a new user
   */
  createUser: CreateUser_BasicCreateUser_createUser | null;
}
