import type { Mongoose } from 'mongoose'
import mongoose from 'mongoose'

import config from '../config'

let connection: Mongoose | null = null

export const getConnection = async () => {
  if (connection !== null) {
    return connection
  }

  try {
    // eslint-disable-next-line require-atomic-updates
    connection = await mongoose.connect(config.MONGO_URI, {
      useNewUrlParser: true,
      useCreateIndex: true,
      useUnifiedTopology: true,
      useFindAndModify: false,
    })
    return connection
  } catch (err) {
    console.error('Failed to obtain a connection to MongoDB')
    console.error(err)
    throw err
  }
}
