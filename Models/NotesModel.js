const mongoose = require('mongoose');
const NoteSchema = new mongoose.Schema(
    {
      content: {
        type: String,
        require: true,
      },
      name: {
        type: String,
      },
  
      noteId: {
        type: String,
      },
      createdAt: {
        type: Date,
        default: Date.now,
      },
      updatedAt: {
        type: Date,
        default: Date.now,
      },
      authorId: {
        type: String,
        required: true,
      },
      type:{
        type:String,
        default:"Personal"
      }
    },
    { timestamps: true }
  );
  const NoteModal = mongoose.model("Note", NoteSchema);
  
  module.exports=NoteModal;
  