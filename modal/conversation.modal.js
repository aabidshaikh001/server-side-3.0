import mongoose,{Schema} from "mongoose";
const messageSchema = new Schema({
    text:{
        type:String,
        default:""
    },
    imageUrl:{
        type:String,
        default:""
    },
    videoUrl:{
        type:String,
        default:""
    },
    seen:{
        type:Boolean,
        default:false
    },
    msgByuserId:{
        type:Schema.Types.ObjectId,
        required:true,
        ref:"User"
    }
},{timestamps:true})
const conversationSchema = new Schema({
    sender:{
         type:Schema.Types.ObjectId,
         required:true,
         ref:"User"
    },
    receiver:{
         type:Schema.Types.ObjectId,
         required:true,
         ref:"User"
    },
    message:[{
        type:Schema.Types.ObjectId,
        ref:"Message"
    }],
    
},{timestamps:true})

export const Message = mongoose.model("Message",messageSchema)
export const Conversation = mongoose.model("Conversation",conversationSchema)
