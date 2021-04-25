import nodemailer from 'nodemailer'
import type Mail from 'nodemailer/lib/mailer'
import type SMTPTransport from 'nodemailer/lib/smtp-transport'

import config from '../../config'

const transport = nodemailer.createTransport({
  host: config.MAIL_HOST,
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
} as SMTPTransport.Options)

transport.verify((err) => {
  if (err) {
    console.error('Error connecting to mail server', err)
    return
  }

  console.log('Succesfully connected to mail server')
})

export const sendMail = async (options: Omit<Mail.Options, 'from'>) => {
  await transport.sendMail(
    Object.assign({ from: 'Cramkle <no-reply@cramkle.com>' }, options)
  )
}
