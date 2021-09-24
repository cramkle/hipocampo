import { addDays, addMinutes, max, min } from 'date-fns'

import type {
  DeckConfiguration,
  LapseFlashcardConfiguration,
  LearningFlashcardConfiguration,
  NewFlashcardConfiguration,
} from '../../mongo/Deck'
import type { Flashcard } from '../../mongo/Note'
import { FlashcardStatus } from '../../mongo/Note'
import type { UserDocument } from '../../mongo/User'
import { endOfUserDay } from '../../utils/date'

export const MINIMUM_ANSWER_QUALITY = 3

export enum FlashcardAnswer {
  REPEAT = 'REPEAT',
  HARD = 'HARD',
  GOOD = 'GOOD',
  EASY = 'EASY',
}

const calculateNextInterval = (reps: number, easeFactor: number): number => {
  if (reps === 0) {
    throw new Error("Cannot calculate next interval when 'reps' is zero.")
  }

  if (reps === 1) {
    return 1
  } else if (reps === 2) {
    return 6
  }

  return Math.ceil(calculateNextInterval(reps - 1, easeFactor) * easeFactor)
}

export const answerToQualityValue = (answer: FlashcardAnswer): number => {
  switch (answer) {
    case FlashcardAnswer.REPEAT:
      return 0
    case FlashcardAnswer.HARD:
      return 3
    case FlashcardAnswer.GOOD:
      return 4
    case FlashcardAnswer.EASY:
      return 5
    default:
      throw new Error(`Unknown answer ${answer}`)
  }
}

/**
 * Calculates the next E-Factor (or easeFactor)
 * given the current answer.
 */
const calculateNextEaseFactor = (easeFactor: number, answerQuality: number) => {
  return Math.max(
    // The easeFactor should never be below 130% (1.3), as a SuperMemo
    // research found that the flashCards can become due more often than
    // is useful and annoy users
    1.3,
    easeFactor +
      (0.1 - (5 - answerQuality) * (0.08 + (5 - answerQuality) * 0.02))
  )
}

const fuzzedIntervalRange = (interval: number) => {
  let fuzz: number

  if (interval < 2) return [1, 1]
  else if (interval === 2) return [2, 3]
  else if (interval < 7) fuzz = interval * 0.25
  else if (interval < 30) fuzz = Math.max(2, interval * 0.15)
  else fuzz = Math.max(4, interval * 0.05)

  // fuzz at least a day
  fuzz = Math.max(fuzz, 1)

  return [interval - fuzz, interval + fuzz]
}

/**
 * Fuzzes an interval.
 */
const fuzzedInterval = (interval: number) => {
  const [minInterval, maxInterval] = fuzzedIntervalRange(interval)

  const range = maxInterval - minInterval

  if (range === 0) {
    return maxInterval
  }

  return Math.floor(Math.random() * range) + minInterval
}

const lapsedInterval = (
  flashcard: Flashcard,
  lapseConfig: LapseFlashcardConfiguration
) => {
  const interval = Math.max(
    1,
    lapseConfig.minimumInterval,
    (flashcard.interval ?? 0) * lapseConfig.intervalPercentage
  )

  return interval
}

/**
 * Schedules a review flashcard, given an answer. Uses
 * the SM2 algorithm when the answer isn't "REPEAT", else
 * uses the lapsed flashcard configuration and reschedules
 * the flashcard as a review.
 */
const scheduleReviewFlashcard = ({
  flashcard,
  answer,
  deckConfig,
  userTimeZone,
}: {
  flashcard: Flashcard
  answer: FlashcardAnswer
  deckConfig: DeckConfiguration
  userTimeZone: string
}) => {
  const lapse = answer === FlashcardAnswer.REPEAT

  if (lapse) {
    flashcard.lapses += 1
    flashcard.easeFactor = Math.max(1.3, flashcard.easeFactor - 0.2)

    // TODO: check leech lapses

    if (deckConfig.lapse.steps) {
      flashcard.status = FlashcardStatus.RELEARNING

      scheduleFlashcardToFirstStep({
        flashcard,
        flashcardConfig: deckConfig.lapse,
        userTimeZone,
        fuzz: true,
      })
    } else {
      flashcard.interval = lapsedInterval(flashcard, deckConfig.lapse)

      scheduleFlashcardAsReview({ flashcard, deckConfig })
      // TODO: check suspended
    }
  } else {
    const answerQuality = answerToQualityValue(answer)
    flashcard.easeFactor = calculateNextEaseFactor(
      flashcard.easeFactor ?? 2.5,
      answerQuality
    )

    flashcard.interval = fuzzedInterval(
      calculateNextInterval(flashcard.reviews, flashcard.easeFactor)
    )

    flashcard.due = addDays(new Date(), flashcard.interval)
  }
}

/**
 * Calculates the graduating interval of a flashcard (i.e. a
 * flashcard that was in learning and is now review).
 */
const graduatingInterval = ({
  flashcard,
  flashcardConfig,
  force,
  fuzz = true,
}: {
  flashcard: Flashcard
  flashcardConfig: NewFlashcardConfiguration
  force: boolean
  fuzz?: boolean
}) => {
  if (
    flashcard.status === FlashcardStatus.REVIEW ||
    flashcard.status === FlashcardStatus.RELEARNING
  ) {
    const bonus = force ? 1 : 0
    return (flashcard.interval ?? 0) + bonus
  }

  let interval: number

  if (!force) {
    // graduate
    interval = flashcardConfig.graduateInterval
  } else {
    // early remove
    interval = flashcardConfig.easyInterval
  }

  if (fuzz) {
    interval = fuzzedInterval(interval)
  }

  return interval
}

/**
 * Schedules the flashcard to a review flashcard. Can
 * be called from either a graduating flashcard (learning and
 * now review) or from a lapsed review flashcard.
 */
const scheduleFlashcardAsReview = ({
  flashcard,
  deckConfig,
  force = false,
}: {
  flashcard: Flashcard
  deckConfig: DeckConfiguration
  force?: boolean
}) => {
  const lapse =
    flashcard.status === FlashcardStatus.REVIEW ||
    flashcard.status === FlashcardStatus.RELEARNING

  flashcard.interval ??= 0

  if (lapse && force) {
    flashcard.interval += 1
  } else if (!lapse) {
    flashcard.interval = graduatingInterval({
      flashcard,
      flashcardConfig: deckConfig.new,
      force,
    })
    flashcard.easeFactor = deckConfig.new.initialEaseFactor
  }

  flashcard.status = FlashcardStatus.REVIEW

  flashcard.due = addDays(new Date(), flashcard.interval)
}

/**
 * Calculates the delay, in minutes, of the current step
 * given a configuration.
 */
const calculateDelayForStep = (
  steps: number[],
  currentStep: number = steps.length
) => {
  const delay = steps[steps.length - currentStep] ?? steps[0] ?? 1

  return delay
}

/**
 * Calculates the middle point in the current step
 * and the possible next step.
 */
const calculateDelayForFailedCardInStep = (
  flashcardConfig: LearningFlashcardConfiguration,
  currentStep: number
) => {
  const delay1 = calculateDelayForStep(flashcardConfig.steps, currentStep)

  let delay2

  if (flashcardConfig.steps.length > 1) {
    delay2 = calculateDelayForStep(flashcardConfig.steps, currentStep - 1)
  } else {
    delay2 = delay1 * 2
  }

  const average = Math.floor((delay1 + Math.max(delay1, delay2)) / 2)

  return average
}

/**
 * Schedule a learning flashcard for another time to study again, with
 * a possibly specified delay set in minutes from the current time.
 */
const rescheduleLearningFlashcard = ({
  flashcard,
  flashcardConfig,
  delay,
  userTimeZone,
  fuzz = true,
}: {
  flashcard: Flashcard
  flashcardConfig: LearningFlashcardConfiguration
  delay?: number
  fuzz?: boolean
  userTimeZone: string
}) => {
  if (delay == null) {
    delay = calculateDelayForStep(
      flashcardConfig.steps,
      flashcard.remainingStepsForGraduation
    )
  }

  flashcard.due = min([
    addMinutes(max([new Date(), flashcard.due ?? 0]), delay),
    endOfUserDay(userTimeZone),
  ])

  if (fuzz) {
    // maximum extra delay to add, 5 minutes or 25% of `delay`
    const maxExtraDelay = Math.max(5, delay * 0.25)
    // random number between 0 and `maxExtraDelay`
    const fuzz = Math.floor(Math.random() * maxExtraDelay)
    flashcard.due = min([
      addMinutes(flashcard.due, fuzz),
      endOfUserDay(userTimeZone),
    ])
  }
}

const scheduleFlashcardToNextStep = ({
  flashcard,
  flashcardConfig,
  userTimeZone,
}: {
  flashcard: Flashcard
  flashcardConfig: LearningFlashcardConfiguration
  userTimeZone: string
}) => {
  flashcard.remainingStepsForGraduation -= 1

  rescheduleLearningFlashcard({
    flashcard,
    flashcardConfig,
    userTimeZone,
    fuzz: false,
  })
}

const scheduleFlashcardToRepeatStep = ({
  flashcard,
  flashcardConfig,
  userTimeZone,
}: {
  flashcard: Flashcard
  flashcardConfig: LearningFlashcardConfiguration
  userTimeZone: string
}) => {
  const delay = calculateDelayForFailedCardInStep(
    flashcardConfig,
    flashcard.remainingStepsForGraduation
  )

  rescheduleLearningFlashcard({
    flashcard,
    flashcardConfig,
    delay,
    userTimeZone,
  })
}

const scheduleFlashcardToFirstStep = ({
  flashcard,
  flashcardConfig,
  userTimeZone,
  fuzz = false,
}: {
  flashcard: Flashcard
  flashcardConfig: LearningFlashcardConfiguration
  userTimeZone: string
  fuzz?: boolean
}) => {
  flashcard.remainingStepsForGraduation = flashcardConfig.steps.length

  if (flashcard.status === FlashcardStatus.RELEARNING) {
    flashcard.interval = lapsedInterval(
      flashcard,
      flashcardConfig as LapseFlashcardConfiguration
    )
  }

  rescheduleLearningFlashcard({
    flashcard,
    flashcardConfig,
    userTimeZone,
    fuzz,
  })
}

const scheduleLearningFlashcard = ({
  flashcard,
  answer,
  deckConfig,
  userTimeZone,
}: {
  flashcard: Flashcard
  answer: FlashcardAnswer
  deckConfig: DeckConfiguration
  userTimeZone: string
}) => {
  const flashcardConfig =
    flashcard.status === FlashcardStatus.RELEARNING
      ? deckConfig.lapse
      : deckConfig.new

  if (answer === FlashcardAnswer.EASY) {
    // force graduate
    scheduleFlashcardAsReview({ flashcard, deckConfig, force: true })
  } else if (answer === FlashcardAnswer.GOOD) {
    if (flashcard.remainingStepsForGraduation - 1 <= 0) {
      // natural graduate
      scheduleFlashcardAsReview({ flashcard, deckConfig, force: false })
    } else {
      // move to next step
      scheduleFlashcardToNextStep({
        flashcard,
        flashcardConfig,
        userTimeZone,
      })
    }
  } else if (answer === FlashcardAnswer.HARD) {
    // repeat
    scheduleFlashcardToRepeatStep({
      flashcard,
      flashcardConfig,
      userTimeZone,
    })
  } else {
    // reset flashcard
    scheduleFlashcardToFirstStep({
      flashcard,
      flashcardConfig,
      userTimeZone,
    })
  }
}

/**
 * Schedules the flashcard based on the answer
 * of the study session.
 */
export const scheduleFlashcard = ({
  flashcard,
  answer,
  deckConfig,
  user,
}: {
  flashcard: Flashcard
  answer: FlashcardAnswer
  deckConfig: DeckConfiguration
  user: UserDocument
}) => {
  const userTimeZone = user.preferences?.zoneInfo ?? 'UTC'

  flashcard.reviews += 1

  if (flashcard.status === FlashcardStatus.NEW) {
    flashcard.status = FlashcardStatus.LEARNING
    flashcard.remainingStepsForGraduation = deckConfig.new.steps.length
  }

  if (
    flashcard.status === FlashcardStatus.LEARNING ||
    flashcard.status === FlashcardStatus.RELEARNING
  ) {
    scheduleLearningFlashcard({
      flashcard,
      answer,
      deckConfig,
      userTimeZone,
    })
  } else if (flashcard.status === FlashcardStatus.REVIEW) {
    scheduleReviewFlashcard({ flashcard, answer, deckConfig, userTimeZone })
  }
}
