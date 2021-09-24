import mongoose from 'mongoose'

process.env.MONGO_URI = process.env.MONGO_URL

jest.mock('../modules/mail/transporter')

const anyGlobal = global as any

beforeAll(async () => {
  anyGlobal.mongoose = await mongoose.connect(process.env.MONGO_URL as string)
})

afterAll(async () => {
  await anyGlobal.mongoose.disconnect()
})
