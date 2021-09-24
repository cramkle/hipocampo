import type { Mongoose } from 'mongoose'
import mongoose from 'mongoose'

import config from '../config'

let connection: Mongoose | null = null

export const getConnection = async () => {
  if (connection !== null) {
    return connection
  }

  try {
    const localConnection = await mongoose.connect(config.MONGO_URI, {
      user: config.MONGO_USER,
      pass: config.MONGO_PASSWORD,
    })

    if (connection === null) {
      connection = localConnection
    }

    return connection
  } catch (err) {
    console.error('Failed to obtain a connection to MongoDB')
    console.error(err)
    throw err
  }
}
