import { compareAsc, endOfToday, isAfter, startOfToday } from 'date-fns'

import { RevisionLogModel } from '../mongo'
import { FlashCardStatus } from '../mongo/Note'
import { RevisionLogDocument } from '../mongo/RevisionLog'
import { MINIMUM_ANSWER_QUALITY } from './scheduler'

const sumByStatus = (logs: RevisionLogDocument[], status: FlashCardStatus) => {
  return logs
    .filter(
      (log, index, array) =>
        array.findIndex(
          ({ flashCardId }) => log.flashCardId === flashCardId
        ) === index
    )
    .reduce((total, log) => (log.status === status ? total + 1 : total), 0)
}

const MAX_NEW_FLASHCARDS_PER_DAY = 20
const MAX_LEARNING_FLASHCARDS_PER_DAY = 100
const MAX_REVIEW_FLASHCARDS_PER_DAY = 50

const STUDY_LIMIT_BY_STATUS = {
  [FlashCardStatus.NEW]: MAX_NEW_FLASHCARDS_PER_DAY,
  [FlashCardStatus.LEARNING]: MAX_LEARNING_FLASHCARDS_PER_DAY,
  [FlashCardStatus.REVIEW]: MAX_REVIEW_FLASHCARDS_PER_DAY,
}

export const studyFlashCardsByDeck = async (deckId: string, ctx: Context) => {
  const todayLogs = await RevisionLogModel.find({
    deckId,
    date: { $gte: startOfToday(), $lte: endOfToday() },
  })

  const finishedFlashCardLogByFlashCardId = new Map<
    string,
    RevisionLogDocument
  >()

  todayLogs.forEach((revisionLog) => {
    if (revisionLog.answerQuality >= MINIMUM_ANSWER_QUALITY) {
      finishedFlashCardLogByFlashCardId.set(
        revisionLog.flashCardId.toString(),
        revisionLog
      )
    }
  })

  const unfinishedFlashCards = todayLogs.filter(
    (log) =>
      log.answerQuality < MINIMUM_ANSWER_QUALITY &&
      !finishedFlashCardLogByFlashCardId.has(log.flashCardId.toString())
  )

  const unfinishedFlashCardLogByFlashCardId = new Map<
    string,
    RevisionLogDocument
  >()

  unfinishedFlashCards.forEach((unfinishedFlashCardLog) => {
    unfinishedFlashCardLogByFlashCardId.set(
      unfinishedFlashCardLog.flashCardId.toString(),
      unfinishedFlashCardLog
    )
  })

  const numOfNew = sumByStatus(todayLogs, FlashCardStatus.NEW)
  const numOfLearning = sumByStatus(todayLogs, FlashCardStatus.LEARNING)
  const numOfReview = sumByStatus(todayLogs, FlashCardStatus.REVIEW)

  const cardCounts = {
    [FlashCardStatus.NEW]: numOfNew,
    [FlashCardStatus.LEARNING]: numOfLearning,
    [FlashCardStatus.REVIEW]: numOfReview,
  }

  const flashCards = (await ctx.flashCardsByDeckLoader.load(deckId))
    .filter((flashCard) => {
      const isUnfinished = unfinishedFlashCardLogByFlashCardId.has(
        flashCard._id.toString()
      )

      if (
        flashCard.due &&
        isAfter(flashCard.due, endOfToday()) &&
        !isUnfinished
      ) {
        return false
      }

      const totalOfStudiedUntilNow = cardCounts[flashCard.status]

      if (totalOfStudiedUntilNow == undefined) {
        return false
      }

      const maxPerDay = STUDY_LIMIT_BY_STATUS[flashCard.status]

      if (isUnfinished) {
        return true
      } else if (totalOfStudiedUntilNow < maxPerDay) {
        cardCounts[flashCard.status]++
        return true
      }

      return false
    })
    .sort((a, b) => {
      if (!a.due && !b.due) {
        return 0
      }

      if (!a.due) {
        return -1
      }

      if (!b.due) {
        return 1
      }

      return compareAsc(a.due, b.due)
    })

  return flashCards
}
