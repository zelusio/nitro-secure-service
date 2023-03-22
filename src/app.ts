import express, {Express} from 'express'
import {walletRouter} from './routers/wallet.router'
// Create an empty express.js application
const app: Express = express()

app.get('/', (request, response) => {
    response.status(200).json({message: 'Hello, world!'})
})

app.use('/wallet', walletRouter)

app.listen(4000, () => {
    console.log('Server listening on port 4000')
})
