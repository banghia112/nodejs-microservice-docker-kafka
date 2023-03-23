const mongoose = require('mongoose');

const Student = new mongoose.Schema({
    name: String,
    age: Number,
    avgScore: Number,
    phone: Number
});

module.exports = mongoose.model('Student', Student)
  