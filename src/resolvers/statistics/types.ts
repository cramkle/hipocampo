import { endOfToday, subDays } from 'date-fns'
import {
  GraphQLEnumType,
  GraphQLFloat,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
} from 'graphql'

import { RevisionLogModel } from '../../mongo'
import { DeckDocument } from '../../mongo/Deck'
import { DeckType } from '../deck/types'

interface DeckStatistics {
  deck: DeckDocument
}

export const IntervalEnumType = new GraphQLEnumType({
  name: 'IntervalEnum',
  values: {
    DAY: { value: 1 },
    WEEK: { value: 7 },
    MONTH: { value: 30 },
    YEAR: { value: 365 },
  },
})

const StudyFrequencyPointType = new GraphQLObjectType({
  name: 'StudyFrequencyPoint',
  fields: {
    date: {
      type: GraphQLNonNull(GraphQLFloat),
      resolve: (root) => root.date.getTime(),
    },
    learning: { type: GraphQLNonNull(GraphQLInt) },
    new: { type: GraphQLNonNull(GraphQLInt) },
  },
})

interface StudyFrequencyArgs {
  interval: number
}

export const DeckStatisticsType = new GraphQLObjectType<
  DeckStatistics,
  Context
>({
  name: 'DeckStatistics',
  fields: {
    deck: {
      type: GraphQLNonNull(DeckType),
    },
    totalStudyTime: {
      type: GraphQLNonNull(GraphQLFloat),
      description: 'The total amount of time studied in milliseconds',
      resolve: async (root) => {
        const [{ totalStudyTime }] = await RevisionLogModel.aggregate<{
          totalStudyTime: number
        }>([
          {
            $match: {
              deckId: root.deck._id,
            },
          },
          {
            $group: {
              _id: null,
              totalStudyTime: {
                $sum: '$timespan',
              },
            },
          },
          {
            $project: {
              _id: 0,
            },
          },
        ])

        return totalStudyTime
      },
    },
    totalTimesStudied: {
      type: GraphQLNonNull(GraphQLInt),
      description: 'The number of times the user has studied this deck',
      resolve: async (root) => {
        return RevisionLogModel.count({ deckId: root.deck._id })
      },
    },
    totalFlashcardsStudied: {
      type: GraphQLNonNull(GraphQLInt),
      description: 'The number of flashcards the user has studied',
      resolve: async (root) => {
        const [{ totalFlashcardsStudied }] = await RevisionLogModel.aggregate<{
          totalFlashcardsStudied: number
        }>([
          { $match: { deckId: root.deck._id } },
          {
            $group: {
              _id: null,
              flashcards: {
                $addToSet: '$flashCardId',
              },
            },
          },
          {
            $project: {
              _id: 0,
              totalFlashcardsStudied: {
                $size: '$flashcards',
              },
            },
          },
        ])

        return totalFlashcardsStudied
      },
    },
    studyFrequency: {
      type: GraphQLNonNull(
        GraphQLList(GraphQLNonNull(StudyFrequencyPointType))
      ),
      args: {
        interval: { type: IntervalEnumType, defaultValue: 7 },
      },
      resolve: (async (root: DeckStatistics, args: StudyFrequencyArgs) => {
        const minDate = subDays(endOfToday(), args.interval)

        const studyFrequency = await RevisionLogModel.aggregate<{
          date: Date
          learning: number
          new: number
        }>([
          {
            $match: { deckId: root.deck._id, date: { $gte: minDate } },
          },
          {
            $group: {
              _id: {
                day: {
                  $dayOfMonth: '$date',
                },
                month: {
                  $month: '$date',
                },
                year: {
                  $year: '$date',
                },
              },
              learning: {
                $sum: {
                  $cond: {
                    if: {
                      $eq: ['$status', 'LEARNING'],
                    },
                    then: 1,
                    else: 0,
                  },
                },
              },
              new: {
                $sum: {
                  $cond: {
                    if: {
                      $eq: ['$status', 'NEW'],
                    },
                    then: 1,
                    else: 0,
                  },
                },
              },
            },
          },
          {
            $project: {
              _id: 0,
              learning: 1,
              new: 1,
              date: {
                $dateFromParts: {
                  day: '$_id.day',
                  month: '$_id.month',
                  year: '$_id.year',
                },
              },
            },
          },
          {
            $sort: {
              date: 1,
            },
          },
        ])

        return studyFrequency
      }) as any,
    },
  },
})
