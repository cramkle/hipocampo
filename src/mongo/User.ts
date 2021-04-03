import bcrypt from 'bcrypt'
import type { Document } from 'mongoose'
import { Schema, model } from 'mongoose'
import * as yup from 'yup'

export interface User {
  username: string
  password: string
  email: string
  roles: string[]
  anonymous?: boolean
  lastLogin?: Date
  createdAt: Date
  preferences?: UserPreferences
  stripeCustomerId?: string
}

export interface UserPreferences {
  zoneInfo: string
  locale: string
  darkMode: boolean
}

export interface UserDocument extends User, Document {
  hashifyAndSave(): Promise<UserDocument>
  comparePassword(candidate: string): Promise<boolean>
}

export interface UserPreferencesDocument extends UserPreferences, Document {}

const UserPreferencesSchema = new Schema<UserPreferencesDocument>({
  zoneInfo: {
    type: String,
    default: 'UTC',
  },
  locale: {
    type: String,
  },
  darkMode: {
    type: Boolean,
    default: false,
  },
})

const UserSchema = new Schema<UserDocument>(
  {
    username: {
      type: String,
      unique: true,
      required: [true, 'usernameIsRequired'],
      validate: [
        (username: string) =>
          yup
            .string()
            .min(4)
            .max(40)
            .matches(/[a-zA-Z][\w-_]*/)
            .isValidSync(username),
        'usernameIsInvalid',
      ],
    },
    password: {
      type: String,
      required: [true, 'passwordIsRequired'],
    },
    email: {
      type: String,
      unique: true,
      required: [true, 'emailIsRequired'],
      validate: [
        (email: string) => yup.string().email().isValidSync(email),
        'emailIsMalformed',
      ],
    },
    anonymous: {
      type: Boolean,
      default: false,
    },
    stripeCustomerId: {
      type: String,
    },
    roles: {
      type: [{ type: String }],
      default: ['REGULAR'],
    },
    lastLogin: {
      type: Schema.Types.Date,
    },
    preferences: { type: UserPreferencesSchema },
    createdAt: { type: Schema.Types.Date },
    updatedAt: { type: Schema.Types.Date },
  },
  { timestamps: { createdAt: true } }
)

UserSchema.methods.hashifyAndSave = function () {
  return new Promise<UserDocument>((res, rej) => {
    bcrypt.hash(this.password, 12, (err, hash) => {
      if (err) {
        console.error(err) // eslint-disable-line no-console
        rej(err)
        return
      }

      this.password = hash
      this.save().then((user) => res(user), rej)
    })
  })
}

UserSchema.methods.comparePassword = function (candidate: string) {
  return new Promise((res, rej) => {
    bcrypt.compare(candidate, this.password, (err, isMatch) => {
      if (err) {
        console.error(err) // eslint-disable-line no-console
        return rej(err)
      }

      res(isMatch)
    })
  })
}

export default model<UserDocument>('User', UserSchema)
