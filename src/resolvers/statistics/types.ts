import {
  differenceInDays,
  differenceInHours,
  eachDayOfInterval,
  eachMonthOfInterval,
  eachYearOfInterval,
  parseISO,
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
import { fromUserDate } from '../../utils/date'
import { DeckType } from '../deck/types'

interface DeckStatistics {
  deck: DeckDocument
}

const StudyFrequencyPointType = new GraphQLObjectType({
  name: 'StudyFrequencyPoint',
  fields: {
    date: {
      type: GraphQLNonNull(GraphQLString),
      resolve: (root) => root.date.toISOString(),
    },
    learning: { type: GraphQLNonNull(GraphQLInt) },
    new: { type: GraphQLNonNull(GraphQLInt) },
    review: { type: GraphQLNonNull(GraphQLInt) },
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
  zoneInfo: string
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
        const [result] = await RevisionLogModel.aggregate<
          | {
              totalStudyTime: number
            }
          | undefined
        >([
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

        return result?.totalStudyTime ?? 0
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
        const [result] = await RevisionLogModel.aggregate<
          | {
              totalFlashcardsStudied: number
            }
          | undefined
        >([
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

        return result?.totalFlashcardsStudied ?? 0
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
        zoneInfo: {
          type: GraphQLString,
          description: 'Timezone',
          defaultValue: 'UTC',
        },
      },
      resolve: (async (root: DeckStatistics, args: StudyFrequencyArgs) => {
        const startDate = parseISO(args.startDate)
        const endDate = parseISO(args.endDate)

        const daysInterval = differenceInDays(endDate, startDate)

        const dateGroupBy =
          daysInterval <= 30
            ? DateGroupBy.DAY
            : daysInterval <= 365
            ? DateGroupBy.MONTH
            : DateGroupBy.YEAR

        const bucketInterval =
          dateGroupBy === DateGroupBy.DAY
            ? eachDayOfInterval({ start: startDate, end: endDate }).map(
                (date, index, array) => {
                  if (index === array.length - 1) return endDate
                  return fromUserDate(date, args.zoneInfo)
                }
              )
            : dateGroupBy === DateGroupBy.MONTH
            ? eachMonthOfInterval({
                start: startDate,
                end: endDate,
              }).map((date) => fromUserDate(date, args.zoneInfo))
            : eachYearOfInterval({
                start: startDate,
                end: endDate,
              }).map((date) => fromUserDate(date, args.zoneInfo))

        const interval = bucketInterval.slice()

        if (bucketInterval.length >= 2) {
          const lastDate = bucketInterval[bucketInterval.length - 1]
          const secondLastDate = bucketInterval[bucketInterval.length - 2]

          if (differenceInHours(lastDate, secondLastDate) < 24) {
            // don't show the same date twice at the end
            interval.pop()
          }
        }

        const studyFrequency = await RevisionLogModel.aggregate<{
          date: Date
          learning: number
          new: number
          review: number
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
                flashcardId: '$flashCardId',
                date: {
                  $switch: {
                    branches: bucketInterval
                      .slice()
                      .reverse()
                      .map((date) => ({
                        case: {
                          $gt: ['$date', date],
                        },
                        then: date,
                      })),
                    default: 0,
                  },
                },
              },
              flashcard: { $first: '$$ROOT' },
            },
          },
          {
            $group: {
              _id: '$_id.date',
              review: {
                $sum: {
                  $cond: {
                    if: {
                      $eq: ['$flashcard.status', 'REVIEW'],
                    },
                    then: 1,
                    else: 0,
                  },
                },
              },
              learning: {
                $sum: {
                  $cond: {
                    if: {
                      $or: [
                        { $eq: ['$flashcard.status', 'LEARNING'] },
                        { $eq: ['$flashcard.status', 'RELEARNING'] },
                      ],
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
              date: '$_id',
              new: 1,
              learning: 1,
              review: 1,
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
                            review: 0,
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
