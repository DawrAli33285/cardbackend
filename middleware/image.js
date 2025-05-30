const multer = require('multer');

const storage = multer.memoryStorage(); 

const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith("image")) { 
        cb(null, true); 
    } else {
        cb(new Error("Invalid file format"), false); 
    }
};

const multerMiddleWare = multer({
    storage,
    fileFilter
});

module.exports = multerMiddleWare;
