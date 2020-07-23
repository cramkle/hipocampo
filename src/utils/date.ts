import { utcToZonedTime, zonedTimeToUtc } from 'date-fns-tz'

/**
 * Converts a date from the user timezone to UTC.
 */
export const fromUserDate = (zonedDate: Date, userTimeZone = 'UTC') => {
  const utcDate = zonedTimeToUtc(zonedDate, userTimeZone)

  return utcDate
}

/**
 * Converts a date from UTC to the user timezone.
 */
export const toUserDate = (utcDate: Date, userTimeZone = 'UTC') => {
  const zonedDate = utcToZonedTime(utcDate, userTimeZone)

  return zonedDate
}
