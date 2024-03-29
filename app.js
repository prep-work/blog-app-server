const express = require('express')
const app = express()

const cors = require('cors')
const morgan = require('morgan')
const cookieParser = require('cookie-parser')

const {PORT} = require('./configuration/config')
const connect = require('./database/connection')

const adminRoute = require('./routes/adminRoute')
const userRoute = require('./routes/userRoute')

app.use(cors())
app.use(morgan('tiny'))
app.use(cookieParser())
app.use(express.urlencoded({ extended: true }))
app.use(express.json())

app.get('/', (request, response) => {
    response.status(200).send({message : "It's working ✌️"})
})

app.use('/api/v1/admin', adminRoute)
app.use('/api/v1/user', userRoute)

connect() 
    .then( () => {
        try{
            app.listen(PORT, console.log(`Server is running at http://localhost:${PORT}`))
        } 
        catch(error) {
            console.log(`Can't connect to database : ${error}`)
        }
    })
    .catch(error => {
        console.log(`Error while connecting to database : ${error}`)
    })
