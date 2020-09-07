import { GraphQLEnumType } from 'graphql'

export const FlashcardAnswerEnumType = new GraphQLEnumType({
  name: 'FlashCardAnswer',
  values: {
    REPEAT: {},
    HARD: {},
    GOOD: {},
    EASY: {},
  },
})
