const dotenv = require('dotenv')
dotenv.config()

const {PORT, DB_URI, ACCESS_TOKEN} = process.env

module.exports = {PORT, DB_URI, ACCESS_TOKEN}