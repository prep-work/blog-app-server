const multer = require('multer')
const path = require('path')

const storage = multer.diskStorage({
    destination: function(request, file, callback) {
        callback(null, path.join(__dirname, '../public/images'))
        // callback(null, 'public/images')
    },
    filename: function(request, file, callback) {
        const fileName = Date.now() + '-' + file.originalname
        callback(null, fileName)
    }
})

const upload = multer({storage})

module.exports = upload