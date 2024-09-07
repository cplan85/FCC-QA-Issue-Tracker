const mongoose = require('mongoose');
const issueSchema = new mongoose.Schema({
    title: {
      type: String,
      required: true,
    },
    project: {
      type: String,
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
    created_on: {
      type: String,
      required: true,
    },
    updated_on: {
      type: String,
    },
    created_by: {
      type: String,
      required: true,
    },
    assigned_to: {
      type: String,
      default: ""
    },
    open: {
      type: Boolean,
      required: true,
      default: true,
    },
    status_text: {
      type: String,
      default: ""
    }

  });
  module.exports =  mongoose.model('Issue', issueSchema);