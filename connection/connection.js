const mongoose = require('mongoose');

const connection = mongoose.connect(`mongodb://127.0.0.1:27017/cardGame`);

// const connection=mongoose.connect(`mongodb+srv://username:newpassword@cluster0.e8whvgv.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`)
module.exports = connection;
