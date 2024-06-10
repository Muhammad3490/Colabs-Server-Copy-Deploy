const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();
const app = express();
const PORT = process.env.PORT || 3000;


mongoose.set('strictQuery',false)
// MongoDB connection setup
const connectDb=async()=>{
    try {
        let connectionDB= await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected Successfully with mongoDB",connectionDB.connection.host);
        
    } catch (error) {
        console.log("Error in connecting with Database",error);
        process.exit(1);
    }
}
app.use(express.json());
app.use(cors());
const UserModal = require('./Models/UserModel')
const NoteModal = require("./Models/NotesModel")
const CollabrationModel=require("./Models/CollabrationModel")
app.use(express.json());

// Add users
app.post("/add/user", async (req, res) => {
  try {
    const { name, email, picture, emailVerified } = req.body;
    if (!name || !email || !picture || !emailVerified) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    // Check if user with the provided email already exists
    let userWithEmail = await UserModal.findOne({ email: email });

    if (userWithEmail) {
      // User with this email already exists, return their _id
      return res
        .status(200)
        .json({ status: "User found", userId: userWithEmail._id });
    } else {
      // Generate a new user ID (for example, using a UUID library)
      // Create a new user
      const newUser = await UserModal.create({
        name,
        email,
        picture,
        emailVerified,
      });

      // Return the newly created user's ID
      return res
        .status(201)
        .json({ status: "User added successfully", userId: newUser._id });
    }
  } catch (error) {
    console.error("Error:", error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
});

app.get("/user", async (req, res) => {
  const id = req.headers["x-user-id"];
  if (!id) {
    return res.json({ Message: "The request must include user id." });
  } else {
    let user = await UserModal.findById(id);

    return res.json({ status: "Success", response: user });
  }
});
const updateUserField = async (userId, fieldName, fieldValue) => {
  try {
    const result = await UserModal.updateOne(
      { _id: userId },
      { $set: { [fieldName]: fieldValue } }
    );
    return result;
  } catch (error) {
    console.error("Error in updating the field", error);
    throw error; // Propagate the error
  }
};

app.get('/get/user/:email', async (req, res) => {
  try {
    const userEmail = req.params.email;
    if (userEmail) {
      const UserId = await UserModal.findOne({ email: userEmail });
      if (UserId) {
        return res.json({ status: "Success", user: UserId });
      } else {
        return res.json({ status: "Failed", message: "User not found" });
      }
    } else {
      return res.json({ status: "Failed", message: "Required field is empty" });
    }
  } catch (error) {
    return res.json({ status: "Failed", message: "Internal Server Error" });
  }
});

const updateNoteField = async (noteId, fieldName, fieldValue) => {
  try {
    const result = await NoteModal.updateOne(
      { _id: noteId },
      { $set: { [fieldName]: fieldValue } }
    );
    return result;
  } catch (error) {
    console.error(`Unable to update ${fieldName}: `, error);
    throw error;
  }
};
app.patch("/edit/name", async (req, res) => {
  const userId = req.headers["x-user-id"];
  if (userId) {
    const name = req.body.name; // Assuming the name is sent in the request body
    if (!name) {
      return res.json({ status: "Failed", message: "Name is required" });
    }

    await updateUserField(userId, "name", name)
      .then((result) => {
        return res.json({ status: "Success", message: result });
      })
      .catch((error) => {
        return res.json({ status: "Failed", message: error });
      });
  } else {
    return res.json({ status: "Failed", message: "User ID is required" });
  }
});


// Unique ID generator function
function generateUniqueId() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const idLength = 4;
  let id = '';

  for (let i = 0; i < idLength; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    id += characters[randomIndex];
  }

  return id;
}

// Add a note
app.post("/add/note", async (req, res) => {
  try {
    const { content, name, authorId } = req.body;

    if (content && authorId && name) {
      // Use current date/time for createdAt and updatedAt
      const createdAt = new Date();
      const updatedAt = createdAt;

      // Generate unique ID for noteId
      const noteId = generateUniqueId();

      // Create new note
      const note = await NoteModal.create({
        noteId,
        name,
        content,
        authorId,
        createdAt,
        updatedAt,
      });

      return res.json({ status: "Success", message: "Note added successfully" });
    } else {
      return res.status(400).json({ status: "Failed", message: "Required fields are missing" });
    }
  } catch (error) {
    console.error("Error:", error.message);
    return res.status(500).json({ status: "Failed", message: "Internal server error" });
  }
});

//edit note content
app.patch("/edit/note/content", async (req, res) => {
  let noteId = req.headers["x-note-id"];
  let note = await NoteModal.findById(noteId);
  if (note) {
    const { fieldValue } = req.body;
    updateNoteField(noteId, "content", fieldValue)
      .then((result) => {
        return res.json({
          status: "Success",
          message: "Successfully updated the note",
          result: result,
        });
      })
      .catch((error) => {
        // Changed then to catch here
        return res.json({ Status: "Failed", message: error });
      });
  } else {
    return res.json({ status: "Failed", message: "Note not found" });
  }
});
//edit note name
app.patch("/edit/note/name", async (req, res) => {
  let noteId = req.headers["x-note-id"];
  let note = await NoteModal.findById(noteId);
  if (note) {
    let {  fieldValue } = req.body;
    updateNoteField(noteId, 'name', fieldValue)
      .then((result) => {
        console.log("Change name req",result)
        return res.json({
          status: "Success",
          message: `name edited successfully.`,
          result: result,
        });
      })
      .catch((error) => {
        console.log("Change name req",error)
        return res.json({
          status: "Failed",
          message: `Unable to edit name`,
          error: error,
        });
      });
  } else {
    return res.json({ status: "Failed", message: "Unable to find note." });
  }
});
app.get("/get/notes", async (req, res) => {
  try {
    let authorId=req.headers['x-user-id'];
    let user= await UserModal.findById(authorId);
    if(user){
      let notes=await NoteModal.find({authorId});
      
      return res.json({status:"Sucess",message:"Notes found successfully",data:notes});
      
    }
    else{
      return res.json({status:"Failed",message:"No notes with related author found"});
    }
  } catch (error) {
    return res.json({status:"Failed",message:"Unable to found data"});
  }
});





app.get('/get/note/:id',async(req,res)=>{
  const id=req.params.id;
  if(id){
    const note=await NoteModal.findById(id);
    return res.json({status:"Success",note:note});
  }
  else{
    return res.json({status:"Failed",message:"Unable to find note."})
  }
})
app.get('/get/note/length/:authorId',async(req,res)=>{
 try{
  const authorId=String(req.params.authorId);
  if(authorId){
    let length=(await NoteModal.find({authorId})).length;
    return res.json({Status:"Success",lenghtOfNote:length});
  }
  else{
    return res.json({status:"Failed",message:"Unable to find user"})
  }
  
 }catch(error){
   return res.json({status:"Failed",message:"Internal server error"})  
 }
})

app.delete('/note/:id', async (req, res) => {
  try {
    const result = await NoteModal.deleteOne({ _id: req.params.id });
    if (result.deletedCount === 1) {
      res.status(200).json({ message: 'Successfully deleted the note.' });
    } else {
      res.status(404).json({ message: 'Note not found.' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error deleting the note.' });
  }
});

const getNotes = async (id) => {
  const Notes = [];
  try {
    if (!Array.isArray(id)) {
      throw new Error('The provided ID list is not an array');
    }

    for (let i = 0; i < id.length; i++) {
      const note = await NoteModal.findById(id[i]);
      if (note) {
        Notes.push(note);
      }
    }
    return Notes;
  } catch (error) {
    console.log("Error in finding the notes", error);
    return [];
  }
}

app.post('/add/collaboration',async(req,res)=>{
  try {
    const senderId=req.headers['x-sentby'];
    const recieverId=req.headers['x-sentto'];
    const {Title,NotesIds}=req.body;
    const checkSender=await UserModal.findById(senderId);
    const checkReciever=await UserModal.findById(recieverId);
    if(checkSender&&checkReciever&&NotesIds){
      if(NotesIds.length>0){
      const Collabration=await CollabrationModel.create(
        {
         Title,
         NotesIds:NotesIds,
         SentBy:senderId,
         SentTo:recieverId,
        }
      )
      return res.json({
        status:"Success",
        message:"Collabration added successfully",
        Collabration
      })
    }
    }
    else{
      
      return res.json({
        status:"Failed",
        message:"Unable to find users with the given ids"
      })
    }
    
  } catch (error) {
    console.log(error)
     return res.json({
      status:"Failed",
      message:"internal server error"
     })
  }
})
const getCollaborations = async (userId) => {
  const collaborations = [];
  try {
    const results = await CollabrationModel.find({
      $or: [{ SentBy: userId }, { SentTo: userId }]
    }).sort({ SentAt: -1 });
    
    console.log("Collaborations found:", results);

    // Add the results to the collaborations array
    collaborations.push(...results);
    return collaborations;
  } catch (error) {
    console.error("Error in finding collaborations:", error);
    return [];
  }
};


app.get('/all/collaborations/:userId',async(req,res)=>{
  try {
    const userId=req.params.userId;
    const checkUserId=await UserModal.findById(userId);
    console.log("User id from get colbs req",checkUserId);
    if(checkUserId){
      const collaborations=await getCollaborations(userId);
      console.log("Collobs from user",collaborations)
      if(collaborations.length>0){
        return res.json(
          {
            status:"Success",
            message:"Successfully fetched collaborations for user",
           collaborations
          }
        )
      }
      else{
        return res.json({status:"Success",message:"No collaboration fetched"})
      }
    }
    else{
      return res.json({status:"Failed",message:"Incorrect user id (collabration fetch response)"});
    }
  } catch (error) {
    console.log(error);
    return res.json({status:"Failed",message:"Internal server error."})
  }
})

app.get('/get/collaboration/:id',async(req,res)=>{
  try {
    let collaborationId=req.params.id;
    let collaboration=await CollabrationModel.findById(collaborationId);
    if(collaboration){
      return res.json({status:"Success",collaboration:collaboration});
    }else{
      console.log("get attacment working in else")
      return res.json({status:"Failed",message:"unable to find the collaboration ",});
    }
  } catch (error) {
    return res.json({status:"Failed",message:"internal server error"});
  }
})
// Start server

connectDb().then(()=>{
    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
      });  
})