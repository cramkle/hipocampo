import {
  differenceInDays,
  eachDayOfInterval,
  eachMonthOfInterval,
  eachYearOfInterval,
  endOfDay,
  parseISO,
  startOfDay,
} from 'date-fns'
import {
  GraphQLFloat,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from 'graphql'

import { RevisionLogModel } from '../../mongo'
import { DeckDocument } from '../../mongo/Deck'
import { fromUserDate, toUserDate } from '../../utils/date'
import { DeckType } from '../deck/types'

interface DeckStatistics {
  deck: DeckDocument
}

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

enum DateGroupBy {
  DAY,
  MONTH,
  YEAR,
}

interface StudyFrequencyArgs {
  startDate: string
  endDate: string
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
        startDate: {
          type: GraphQLNonNull(GraphQLString),
          description: 'Start interval date in ISO format',
        },
        endDate: {
          type: GraphQLNonNull(GraphQLString),
          description: 'End interval date in ISO format',
        },
      },
      resolve: (async (
        root: DeckStatistics,
        args: StudyFrequencyArgs,
        ctx: Context
      ) => {
        const startDate = fromUserDate(
          startOfDay(
            toUserDate(
              parseISO(args.startDate),
              ctx.user?.preferences?.zoneInfo
            )
          ),
          ctx.user?.preferences?.zoneInfo
        )
        const endDate = fromUserDate(
          endOfDay(
            toUserDate(parseISO(args.endDate), ctx.user?.preferences?.zoneInfo)
          ),
          ctx.user?.preferences?.zoneInfo
        )

        const daysInterval = differenceInDays(endDate, startDate)

        const dateGroupBy =
          daysInterval <= 30
            ? DateGroupBy.DAY
            : daysInterval <= 365
            ? DateGroupBy.MONTH
            : DateGroupBy.YEAR

        const interval =
          dateGroupBy === DateGroupBy.DAY
            ? eachDayOfInterval({ start: startDate, end: endDate })
            : dateGroupBy === DateGroupBy.MONTH
            ? eachMonthOfInterval({ start: startDate, end: endDate })
            : eachYearOfInterval({ start: startDate, end: endDate })

        const studyFrequency = await RevisionLogModel.aggregate<{
          date: Date
          learning: number
          new: number
        }>([
          {
            $match: {
              deckId: root.deck._id,
              date: { $gte: startDate, $lte: endDate },
            },
          },
          {
            $group: {
              _id: {
                flashCardId: '$flashCardId',
                ...(dateGroupBy <= DateGroupBy.DAY
                  ? {
                      day: {
                        $dayOfMonth: '$date',
                      },
                    }
                  : null),
                ...(dateGroupBy <= DateGroupBy.MONTH
                  ? {
                      month: {
                        $month: '$date',
                      },
                    }
                  : null),
                year: {
                  $year: '$date',
                },
              },
              flashcard: { $first: '$$ROOT' },
            },
          },
          {
            $group: {
              _id: {
                ...(dateGroupBy <= DateGroupBy.DAY
                  ? {
                      day: '$_id.day',
                    }
                  : null),
                ...(dateGroupBy <= DateGroupBy.MONTH
                  ? {
                      month: '$_id.month',
                    }
                  : null),
                year: '$_id.year',
              },
              learning: {
                $sum: {
                  $cond: {
                    if: {
                      $eq: ['$flashcard.status', 'LEARNING'],
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
                      $eq: ['$flashcard.status', 'NEW'],
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
                  day: dateGroupBy <= DateGroupBy.DAY ? '$_id.day' : 1,
                  month: dateGroupBy <= DateGroupBy.MONTH ? '$_id.month' : 1,
                  year: '$_id.year',
                },
              },
            },
          },
          {
            $group: {
              _id: null,
              stats: { $push: '$$ROOT' },
            },
          },
          {
            $project: {
              stats: {
                $map: {
                  input: interval,
                  as: 'date',
                  in: {
                    $let: {
                      vars: {
                        dateIndex: { $indexOfArray: ['$stats.date', '$$date'] },
                      },
                      in: {
                        $cond: {
                          if: { $ne: ['$$dateIndex', -1] },
                          then: { $arrayElemAt: ['$stats', '$$dateIndex'] },
                          else: {
                            date: '$$date',
                            learning: 0,
                            new: 0,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          {
            $unwind: '$stats',
          },
          {
            $replaceRoot: {
              newRoot: '$stats',
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
