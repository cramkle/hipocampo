import morgan from 'morgan'

export function logger() {
  return morgan('dev')
}
