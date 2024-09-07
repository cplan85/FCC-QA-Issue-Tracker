const mongoose = require('mongoose');
const projectSchema = new mongoose.Schema({
    name: {
      type: String,
      required: true,
      unique: true,
    },
    //change HERE TO STRING
    issues: {
      type: [String]
    }
  });
  module.exports =  mongoose.model('Project', projectSchema);