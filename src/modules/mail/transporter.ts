import nodemailer from 'nodemailer'
import type Mail from 'nodemailer/lib/mailer'

import config from '../../config'

const transport = nodemailer.createTransport({
  host: config.MAIL_HOST,
  secure: true,
  port: 465,
  auth: {
    user: config.MAIL_USERNAME,
    pass: config.MAIL_PASSWORD,
  },
})

const mailServerReadyPromise = new Promise<void>((resolve) => {
  transport.verify((err) => {
    if (err !== null) {
      console.log('Error connecting to email server: ' + err)
      return resolve()
    }

    console.log('Successfully connected to email server')
    resolve()
  })
})

export const sendMail = async (options: Mail.Options) => {
  try {
    await mailServerReadyPromise
  } catch {
    return
  }

  return new Promise<any>((resolve, reject) => {
    transport.sendMail(options, (err, info) => {
      if (err !== null) {
        return reject(err)
      }
      resolve(info)
    })
  })
}
