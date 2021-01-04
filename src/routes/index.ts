import express from 'express'

import graphqlMiddleware from '../middlewares/graphql'
import authRouter from './auth'

const router = express.Router()

graphqlMiddleware.set(router)

router.use('/auth', authRouter)

export default router
