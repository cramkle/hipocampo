import { utcToZonedTime, zonedTimeToUtc } from 'date-fns-tz'

export const fromUserDate = (date: Date, userTimeZone = 'UTC') => {
  const zonedDate = new Date(date.getTime())

  const utcDate = zonedTimeToUtc(zonedDate, userTimeZone)

  return utcDate
}

export const toUserDate = (date: Date, userTimeZone = 'UTC') => {
  const utcDate = new Date(date.getTime())

  const zonedDate = utcToZonedTime(utcDate, userTimeZone)

  return zonedDate
}
