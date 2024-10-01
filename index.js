import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import connectDB from './config/connectDB.js'
import router from './router/index.js'
import cookieParser from 'cookie-parser'
import { app, server } from './socket/index.js'
import path from 'path'

//  const app = express()
dotenv.config({
    path:'./.env'
})

app.use(cors({
    origin:'https://woopab.vercel.app',
    credentials:true
}))
app.use(cookieParser())
app.use(express.json())

  //api end point
  app.use('/api',router)
// --------deployment---------------
// const _dirname1 = path.resolve()
// if(process.env.NODE_ENV==='production'){
//     app.use(express.static(path.join(_dirname1,"/build")));
//     app.get("*",(req,res)=>{
//          res.sendFile(path.resolve(_dirname1, "build", "index.html"))
//     })

// }
// else{
//     app.get('/',(req,res)=>{
//         res.send('API is Running SuccessFully')
//     })
// }
// --------deployment---------------

    
  connectDB()
  .then(()=>{
    server.listen(process.env.PORT,()=>{
        console.log(`server is running on PORT:${process.env.PORT}`);
        
    })
})
.catch((err)=>{
    console.log("MongoDB Connection failed !!!",err);
    
})
