const mongoose = require("mongoose");

const CollabrationSchema = new mongoose.Schema(
  {
    Title: {
      type: String,
    },
    NotesIds: {
      type: [String],
      required: true,
    },
    SentBy: {
      type: String,
      required: true,
    },
    SentTo: {
      type: String,
      required: true,
    },
    SentAt: {
      type: Date,
      default: Date.now,
    },
    Notes: {
      type: [String],
      required: true,
    },
  },
  { timestamps: true }
);

const CollabrationModel = mongoose.model("Collabration", CollabrationSchema);
module.exports = CollabrationModel;
