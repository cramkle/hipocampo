import { compareAsc, endOfDay, isAfter, startOfDay } from 'date-fns'

import { RevisionLogModel } from '../mongo'
import { FlashCard, FlashCardStatus } from '../mongo/Note'
import { RevisionLogDocument } from '../mongo/RevisionLog'
import { fromUserDate, toUserDate } from './date'

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

const getFlashcardCountStatus = (flashcard: FlashCard) => {
  if (flashcard.status === FlashCardStatus.LEARNING) {
    return FlashCardStatus.REVIEW
  }
  return flashcard.status
}

export const studyFlashcardsByDeck = async (deckId: string, ctx: Context) => {
  const userTimeZone = ctx.user?.preferences?.zoneInfo

  const deck = await ctx.deckLoader.load(deckId)

  const studyLimitByStatus = {
    [FlashCardStatus.NEW]: deck.configuration.new.perDay,
    [FlashCardStatus.REVIEW]: deck.configuration.review.perDay,
  }

  const now = toUserDate(new Date(), userTimeZone)

  const [startDate, endDate] = [startOfDay(now), endOfDay(now)].map((date) =>
    fromUserDate(date, userTimeZone)
  )

  const todayLogs = await RevisionLogModel.find({
    deckId,
    date: { $gte: startDate, $lte: endDate },
  })

  const flashcardLogByFlashcardId = new Map<string, RevisionLogDocument>()

  todayLogs.forEach((revisionLog) => {
    flashcardLogByFlashcardId.set(
      revisionLog.flashCardId.toString(),
      revisionLog
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

  const flashcards = (await ctx.flashcardsByDeckLoader.load(deckId))
    .filter((flashcard) => {
      const studiedToday = flashcardLogByFlashcardId.has(
        flashcard._id.toString()
      )

      if (flashcard.due && isAfter(flashcard.due, endDate)) {
        return false
      }

      const countStatus = getFlashcardCountStatus(flashcard)

      const totalOfStudiedUntilNow = cardCounts[countStatus]

      if (totalOfStudiedUntilNow == undefined) {
        return false
      }

      const maxPerDay = studyLimitByStatus[countStatus]

      if (studiedToday) {
        return true
      } else if (totalOfStudiedUntilNow < maxPerDay) {
        cardCounts[flashcard.status]++
        return true
      }

      return false
    })
    .sort((a, b) => {
      if (!a.due && !b.due) {
        return a.flashcardIndex - b.flashcardIndex
      }

      if (!a.due) {
        return -1
      }

      if (!b.due) {
        return 1
      }

      return compareAsc(a.due, b.due)
    })

  return flashcards
}
