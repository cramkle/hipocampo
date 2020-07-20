import { zonedTimeToUtc } from 'date-fns-tz'

export const toUserDate = (date: Date, userTimeZone = 'UTC') => {
  const zonedDate = new Date(date.toISOString())

  const utcDate = zonedTimeToUtc(zonedDate, userTimeZone)

  return utcDate
}
