const mongoose = require('mongoose');


const Class = new mongoose.Schema({
    number: Number,
    numberOfStudents: Number,
    avgScore: Number,
    students: Array
});


module.exports = mongoose.model('Classes', Class)
  