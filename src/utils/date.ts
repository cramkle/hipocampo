import { utcToZonedTime } from 'date-fns-tz'

export const toUserDate = (date: Date, userTimeZone = 'UTC') => {
  const utcDate = new Date(date.toISOString())

  const zonedDate = utcToZonedTime(utcDate, userTimeZone)

  return zonedDate
}
