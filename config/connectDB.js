import mongoose from "mongoose";
const connectDB = async ()=>{
    try {
       const connectioninstance = await mongoose.connect(`${process.env.MONGODBURL}`);
       console.log(`\n MonogDB connected !! DB Host :${connectioninstance.connection.host}`);
       
    } catch (error) {
        console.error("MONGODB COONECTION ERROR",error)
        process.exit(1)

    }
}

export default connectDB