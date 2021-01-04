import bcrypt from 'bcrypt'
import { Document, Schema, model } from 'mongoose'
import * as yup from 'yup'

export interface User {
  username: string
  password: string
  email: string
  roles: string[]
  lastLogin?: Date
  createdAt: Date
  preferences?: UserPreferences
}

export interface UserPreferences {
  zoneInfo: string
  locale: string
  darkMode: boolean
}

export interface UserDocument extends User, Document {
  hashifyAndSave(): Promise<void>
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
        (username) =>
          yup
            .string()
            .min(4)
            .max(20)
            .matches(/[a-zA-Z](\w)*/)
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
        (email) => yup.string().email().isValidSync(email),
        'emailIsMalformed',
      ],
    },
    roles: {
      type: [{ type: String }],
      default: ['REGULAR'],
    },
    lastLogin: {
      type: Schema.Types.Date,
    },
    preferences: UserPreferencesSchema,
    createdAt: { type: Schema.Types.Date },
    updatedAt: { type: Schema.Types.Date },
  },
  { timestamps: { createdAt: true } }
)

UserSchema.methods.hashifyAndSave = function () {
  return new Promise((res, rej) => {
    bcrypt.hash(this.password, 12, (err, hash) => {
      if (err) {
        console.error(err) // eslint-disable-line no-console
        rej(err)
        return
      }

      this.password = hash
      this.save().then(() => res(), rej)
    })
  })
}

UserSchema.methods.comparePassword = function (candidate) {
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
