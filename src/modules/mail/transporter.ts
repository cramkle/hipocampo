import nodemailer from 'nodemailer'
import type Mail from 'nodemailer/lib/mailer'

import config from '../../config'

const transport = nodemailer.createTransport({
  // @ts-ignore
  host: config.MAIL_HOST,
  secure: false,
  requireTLS: true,
  logger: true,
  port: 587,
  auth: {
    user: config.MAIL_USERNAME,
    pass: config.MAIL_PASSWORD,
  },
  dkim: config.DKIM_PRIVATE_KEY
    ? {
        domainName: config.DKIM_DOMAIN_NAME,
        keySelector: config.DKIM_KEY_SELECTOR,
        privateKey: config.DKIM_PRIVATE_KEY,
      }
    : undefined,
})

export const sendMail = async (options: Mail.Options) => {
  return new Promise<any>((resolve, reject) => {
    transport.sendMail(options, (err, info) => {
      if (err !== null) {
        return reject(err)
      }
      resolve(info)
    })
  })
}
