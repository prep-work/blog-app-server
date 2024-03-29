const express = require('express')
const app = express()
const PORT = 3500

app.get('/', (request, response) => {
    response.status(200).send({message: "It's working"})
})

app.listen(PORT)