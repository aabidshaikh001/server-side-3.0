import mongoose,{Schema} from "mongoose";
const userSchema = new Schema({
    name:{
        type:String,
        required:[true, "provide name"]
    },
    email:{
        type:String,
        required:[true, "provide email"],
        unique:true
    },
    password:{
        type:String,
        required:[true, "provide password"],
    },
    profilePic:{
        type:String,
        default:'',
    }
    
},{timestamps:true})

export const User = mongoose.model("User",userSchema)