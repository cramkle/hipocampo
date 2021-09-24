import { json, urlencoded } from 'body-parser'
import cookieParser from 'cookie-parser'

export function io() {
  return [cookieParser(), json(), urlencoded({ extended: false })]
}
