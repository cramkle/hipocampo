import express from 'express'

import { graphql } from '../middlewares/graphql'
import authRouter from './auth'

const router = express.Router()

router.use('/graphql', graphql())

router.use('/auth', authRouter)

export default router
