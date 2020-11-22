import express from 'express'

import authMiddleware from '../middlewares/auth'
import graphqlMiddleware from '../middlewares/graphql'
import ioMiddleware from '../middlewares/io'
import authRouter from './auth'

const router = express.Router()

ioMiddleware.set(router)
authMiddleware.set(router)
graphqlMiddleware.set(router)

router.use('/auth', authRouter)

export default router
