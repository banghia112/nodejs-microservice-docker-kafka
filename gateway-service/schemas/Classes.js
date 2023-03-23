const mongoose = require('mongoose');


const Class = new mongoose.Schema({
    name: String,
    numberOfStudents: Number
});


module.exports = mongoose.model('Classes', Class)
  