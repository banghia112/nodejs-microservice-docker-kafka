const mongoose = require('mongoose');


const Grade = new mongoose.Schema({
    name: String,
    floor: Number,
    building: String
});

module.exports = mongoose.model('Grade', Grade)
  