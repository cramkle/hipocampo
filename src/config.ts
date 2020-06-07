import path from 'path'

require('dotenv').config({
  path: path.join(process.cwd(), '.env'),
})

const {
  MONGO_URI,
  NODE_ENV,
  PORT,
  REDIS_HOST,
  REDIS_PORT,
  RESET_PASSWORD_TOKEN,
  SESSION_SECRET,
} = process.env

export default {
  MONGO_URI: MONGO_URI as string,
  NODE_ENV: NODE_ENV as string,
  PORT: Number(PORT) || 5000,
  REDIS_HOST: REDIS_HOST as string,
  REDIS_PORT: Number(REDIS_PORT) || 6379,
  RESET_PASSWORD_TOKEN: RESET_PASSWORD_TOKEN as string,
  SESSION_SECRET: SESSION_SECRET as string,
}
